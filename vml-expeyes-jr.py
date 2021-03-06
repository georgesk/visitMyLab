#!/usr/bin/python

# -*- coding: utf-8 -*-
# VISIT MY LABORATORY

from __future__ import print_function, with_statement
from threading import Thread, Event
from base64 import b64encode

import fcntl, sys, re, time
import cherrypy, json
import expeyes.eyesj
import os.path
import cv2

## to save ODS files
from odf.opendocument import OpenDocumentSpreadsheet
from odf.style import Style, TextProperties, ParagraphProperties
from odf.style import TableColumnProperties
from odf.text import P
from odf.table import Table, TableColumn, TableRow, TableCell
import io

class ExpPage:
    """
    @class ExpPage HANDLE ALL WEB PAGE REQUESTS
    """

    def __init__(self):
        """
        The constructor.
        """
        self.active=True       # state of the automaton
        self.hw_lock=False     # a lockto prevent double initialization
        self.device=None       # Expeyes driver
        self.measurements=None # data returned by the measurement box
        self.oldMeasurements=None # backup data
        # backup data are served if too much requests are coming simultaneously
        self.mtype=''          # typeof data describing the measurements
        self.connect()         # initializes the driver
        self.first_config="true" # scope is not yet configured for samples, etc.
        return
		
    def connect(self):
        """
        tries to connect Expeyes-Jr. This should succeed if Expeyes-Jr
        is physically plugged, even if it is currently in "connected" state.
        """
        if self.device !=None:
            self.device.fd.close()
        self.device = expeyes.eyesj.open()
        return
    
    @cherrypy.expose
    def index(self):
	"""
        features the home page
        @return an HTML file with all necessary JS libraries included,
        """
        return file("templates/index-vml.html")

    @cherrypy.expose
    def reconnect(self):
        """
        Connects to the hardware again. Does nothing when self.active
        is False (engine is stopping) or self.hw_lock is True (the
        hardware is processing some call.
        @return True if the initialization has been triggered again, else False
        """
        if (not self.active) or self.hw_lock:
            return False
        self.hw_lock=True
        self.connect()
        sys.stdout.write('\nre-init called\n\n')
        self.__init__()
        self.hw_lock=False
        return True

    expeyes_inputs={
        "A1":1,
        "A2":2,
    }

    @cherrypy.expose
#    @cherrypy.tools.json_out()
    def oneScopeChannel(self, **kw):
        """
        This method launches a series of measurements made at one analog
        input and returns their values.
        @param kw json encoded dictionary of keywords. Allowed keywords are:
        - config:   boolean; when it is True or when the scope had never
          been configured, the other parameters are taken in account
        - input:    integer or string, selects an analog input;
          defaults to 1 (channel A1). If it is a string like "A1", "A2", etc.
          then the string will be converted to a relevant value.
        - samples:  integer, number of samples; defaults to 201 (200 intervals)
        - delay:    integer, delay in microsecond between two samples;
          defaults to 200 (200 * 200 microseconds= 40 ms)
        - duration: float, total time span of the measurements in second
        By default, measures voltage at input A1, 201 samples spanning 40 ms.
        If the keyword 'duration' is used, it will redefine the value of
        delay, which is 200 microseconds by default.
        @return measurement values
        """
        kw=json.loads(kw["options"])
        # default values
        if ("config"in kw and kw["config"]) or self.first_config:
            if self.first_config:
                self.first_config=False
                self.inp = 1
                self.samples = 201
                self.delay = 200

            if 'input' in kw and kw['input']:
                # sets the input according to parameters
                input=kw['input']
                if input in ExpPage.expeyes_inputs:
                    input=ExpPage.expeyes_inputs[input]
                    self.inp=input
                else:
                    try :
                        input=int(input)
                        self.inp=input
                    except:
                        pass

            if 'samples' in kw and kw['samples']:
                try:
                    self.samples=kw['samples']
                except:
                    pass
            if 'delay' in kw and kw['delay']:
                try:
                    self.delay=int(kw['delay']*1000000)
                except:
                    pass
            if 'duration' in kw and kw['duration']:
                try:
                    self.delay=int(1000000*kw['duration']/(self.samples-1))
                except:
                    pass

        self.mtype = 't,v' # two arrays, first for time, second for voltage
        if self.hw_lock:
            return json.dumps(self.oldMeasurements)
        self.hw_lock=True
        self.oldMeasurements=self.measurements # backups old data
        self.measurements = self.device.capture(self.inp, self.samples, self.delay)
        self.hw_lock=False
        return json.dumps(self.measurements)

    sampleArray=[11,21,51,101,201,501,1001]
    
    @cherrypy.expose
    def sampleMinus(self, **kw):
        """
        chooses a lower value for self.samples if possible,
        while keeping the same total duration
        @param kw a dummy dictionary to catch the session param
        """
        oldSamples=self.samples
        if self.samples in ExpPage.sampleArray:
            i=ExpPage.sampleArray.index(self.samples);
            if i > 0:
                self.samples=ExpPage.sampleArray[i-1]
        else:
            i=0;
            while i < len(ExpPage.sampleArray)-2 and self.samples > ExpPage.sampleArray[i+1]:
                i+=1
            self.samples=ExpPage.sampleArray[i]
        if oldSamples != self.samples:
            self.delay=int(self.delay*(oldSamples-1)/(self.samples-1))
        return self.croData()
        
    @cherrypy.expose
    def samplePlus(self, **kw):
        """
        chooses a higher value for self.samples if possible
        @param kw a dummy dictionary to catch the session param
        """
        oldSamples=self.samples
        if self.samples in ExpPage.sampleArray:
            i=ExpPage.sampleArray.index(self.samples);
            if i < len(ExpPage.sampleArray)-1:
                self.samples=ExpPage.sampleArray[i+1]
        else:
            i=len(ExpPage.sampleArray)-1;
            while i > 0 and self.samples < ExpPage.sampleArray[i-1]:
                i-=1
            self.samples=ExpPage.sampleArray[i]
        if oldSamples != self.samples:
            self.delay=int(self.delay*(oldSamples-1)/(self.samples-1))
        return self.croData()

    durationArray=[100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,200000, 500000]
    @cherrypy.expose
    def durationMinus(self, **kw):
        """
        reduces the duration of the record when possible; modifies the
        values of self.samples and self.delay; self.samples remains inside
        the set ExpPage.sampleArray; self.delay cannot be less than 10
        microseconds
        """
        oldDuration=self.delay*(self.samples - 1)
        duration=oldDuration
        samples=self.samples
        for d in ExpPage.durationArray[::-1]:
            if d < duration:
                duration=d
                break
        delay=duration/(samples-1)
        while delay < 10: # delay cannot be less than 10 microseconds
            for s in ExpPage.sampleArray[::1]:
                if s < samples:
                    samples=s
                    break
            delay=duration/(samples-1)
            # as duration >= 100 and samples can be as low as 11,
            # delay will be at least 10, so this iteration will end.
        if duration !=oldDuration:
            self.delay=delay
            self.samples=samples
        return self.croData()
    
    @cherrypy.expose
    def durationPlus(self, **kw):
        """
        increases the duration of the record when possible; modifies the
        values of self.samples and self.delay; self.samples remains inside
        the set ExpPage.sampleArray; self.delay cannot be less than 10
        microseconds
        """
        oldDuration=self.delay*(self.samples - 1)
        duration=oldDuration
        samples=self.samples
        for d in ExpPage.durationArray:
            if d > duration:
                duration=d
                break
        delay=duration/(samples-1)
        if duration !=oldDuration:
            self.delay=delay
            self.samples=samples
        return self.croData()

    @cherrypy.expose
    def setOD1(self, **kw):
        """
        sets the digital output OD1, with the given boolean value
        @param kw dictionary of parameters, featuring:
         -val an integer, 0 or 1
        @return the feedback value from OD1
        """
        od1=10
        return json.dumps(self.device.set_state(od1, int(kw["val"])))
        
    @cherrypy.expose
    def setPVS(self, **kw):
        """
        sets the programmable voltage source PVS, with the given value
        @param kw dictionary of parameters, featuring:
         -val a stringified integer between 0 and 5000
        @return the feedback value from PVS
        """
        return json.dumps(self.device.set_voltage(float(kw["val"])/1000.0))
        
    @cherrypy.expose
    def setSQR(self, **kw):
        """
        sets a given square generator SQR1 or SQR2, with a given frequency
        @param kw dictionary of parameters, featuring:
         -val a stringified float between 0 and 20000 for the frequency
         -sqr a stringified integer: 1 for SQR1 and 2 for SQR2
        @return the feedback value from the generator
        """
        val=float(kw["val"])
        if val==0.0:
            if kw["sqr"]=="1":
                self.device.set_sqr1(-1) # sets the output to zero volt
                return json.dumps(0)
            elif kw["sqr"]=="2":
                self.device.set_sqr2(-1) # sets the output to zero volt
                return json.dumps(0)
        else:
            if kw["sqr"]=="1":
                return json.dumps(self.device.set_sqr1(val))
            elif kw["sqr"]=="2":
                return json.dumps(self.device.set_sqr2(val))
        
    def croData(self):
        """
        returns a dictionary with data for Javascript's callbacks, to update
        data inside the CRO's display and buttons
        """
        result={}
        result["samples"]=self.samples
        result["duration"]=(self.samples-1)*self.delay/1000
        return json.dumps(result)
    
    @cherrypy.expose
    def getValues(self, **kw):
        """
        a routine to get measured values as a useful file
        @param kw keywords; allowed keywords are:
        - mode: the way you want to get the values
        The default mode is "ascii", which means that
        values are formated as ascii lines (space-separated numbers).
        <BR>
        Other supported modes are not yet implemented
        @return a stream with the relevant MIMEtype.
        """
        filename="values-{0}".format(time.strftime("%Y-%m-%d_%H_%M_%S"))
        if 'mode' in kw:
            mode=kw['mode']
        else:
            #mode='ascii'
            mode='ods'
        if mode=="ascii":
            ## define response headers
            cherrypy.response.headers["Content-Type"]="text/ascii;charset=utf-8"
            cherrypy.response.headers['Content-Disposition'] = 'attachment; filename={}.txt'.format(filename)
            ## send the data
            if self.mtype=='t,v':
                result=""
                t,v = self.measurements
                for i in range(len(t)):
                    result+="{0:f} {1:f}\n".format(t[i], v[i])
                return result
            else:
                return "mode = '%s', measurement type '%s' not supported." %(mode, self.mtype)
        elif mode=="ods":
            ## define response headers
            cherrypy.response.headers["Content-Type"]="application/vnd.oasis.opendocument.spreadsheet"
            cherrypy.response.headers['Content-Disposition'] = 'attachment; filename={}.ods'.format(filename)
            ## send the data
            if self.mtype=='t,v':
                doc = OpenDocumentSpreadsheet()
                # Start the table, and describe the columns
                table = Table(name="Expeyes-Jr {0}".format(time.strftime("%Y-%m-%d %Hh%Mm%Ss")))

                ## column titles
                tr = TableRow()
                table.addElement(tr)
                tc = TableCell()
                tr.addElement(tc)
                p = P(text='t (ms)')
                tc.addElement(p)

                tc = TableCell()
                tr.addElement(tc)
                input=self.inp
                for name in ExpPage.expeyes_inputs:
                    if ExpPage.expeyes_inputs[name]== self.inp:
                        input=name
                        break
                p = P(text=input+' (V)')
                tc.addElement(p)

                ## write values
                t,v=self.measurements
                for i in range(len(t)):
                    tr = TableRow()
                    table.addElement(tr)
                    tc = TableCell(valuetype="float", value=str(t[i]))
                    tr.addElement(tc)

                    tc = TableCell(valuetype="float", value=str(v[i]))
                    tr.addElement(tc)

                doc.spreadsheet.addElement(table)
                result=io.BytesIO()
                doc.save(result)
                return result.getvalue() 
            else:
                return "mode = '%s', measurement type '%s' not supported." %(mode, self.mtype)
        return "non-supported mode %s" %mode

    lastSeen =time.time()
    @cherrypy.expose
    def webcam(self):
        """
        returns a webcam snapshot upon every call
        """
        """
        ========= NOT WORKING NOW SINCE cv2.imencode() is buggy
        global currentPhoto
        if not crrentPhoto
            return
        """
        if not os.path.exists("/tmp/webcam.jpg"):
            return
        """
        =========== This one delivers a downloadable file once
        cherrypy.response.headers["Content-Type"]="image/jpeg"
        cherrypy.response.headers['Content-Disposition'] = 'attachment; filename=photo.jpg'
        return file("/tmp/webcam.jpg")
        """
        return """
<img src="data:image/jpg;base64,%s">
<script type="text/javascript">
        setTimeout(function(){
        window.location.reload(1);
        }, 1000);
</script>
""" % b64encode(file("/tmp/webcam.jpg").read())
        
        
		
def stopit():
    """
    Callback function which is assigned to channels "stop" and "exit"
    """
    global app # this one is defined during the call to startServer
    app.active=False
    if cherrypy.engine.state != cherrypy.engine.states.STARTED:
        sys.exit(1)
    return


def checkLock(lockFileName='expeyes-server.lock'):
    """
    checks that the server is launched only once. Uses a lock file
    @param lockFileName the name of the lock file. The default value
    should be used.
    @return true if the process can control the lock file
    """
    fp = open(lockFileName, 'w')
    try:
        fcntl.lockf(fp, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except IOError:
        # another instance is running
        sys.stdout.write ("Another instance is running. Not starting.\n")
        sys.exit(1)
    return True

class PhotoThread(Thread):
    def __init__(self, event):
        Thread.__init__(self)
        self.stopped = event

    def run(self):
        global cap
        global currentPhoto
        while not self.stopped.wait(1):
            # print "GRRR Photo thread %s" % time.time()
            # call a function
            ret, frame = cap.read()
            # ret, jpeg = cv2.imencode('.jpg', frame)
            # currentPhoto=jpeg.tobytes()
            cv2.imwrite("/tmp/webcam.jpg", frame)

            
def startServer():
    """
    Starts the web service
    """
    global app
    abspath=os.path.abspath('.')
    conffile = os.path.join(abspath, 'server.conf')
    confdict={
        "/": {
            'tools.staticfile.root': abspath,
            'tools.staticdir.root': abspath,
        },
    }
    cherrypy.config.update(confdict)
    cherrypy.config.update(conffile)
    app = cherrypy.tree.mount(ExpPage(), '/', conffile)
    app.merge(confdict)
    stopit.priority = 1
    cherrypy.engine.subscribe('stop', stopit)
    cherrypy.engine.subscribe('exit', stopit)
    cherrypy.engine.start()
    cherrypy.engine.block()
    return



if __name__=='__main__':
    checkLock() # aborts if the server is already running.
    app=None          # global variable
    currentPhoto=None # global variable to serve webcam snapshots
    stopEvent=Event() # global variable; call its set method to stop
    photoThread=PhotoThread(stopEvent)
    ## initialize the camera
    cap=None          #global variable
    cap = cv2.VideoCapture(0)
    photoThread.start()
    startServer()
    
# Local Variables:
# mode: Python
# python-indent: 4
# End:
