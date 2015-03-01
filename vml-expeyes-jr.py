#!/usr/bin/python

# -*- coding: utf-8 -*-
# VISIT MY LABORATORY

from __future__ import print_function, with_statement

import fcntl, sys, re, time
import cherrypy, json
import expeyes.eyesj
import os.path

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
        expeyes_inputs={
            "A1":1,
            "A2":2,
            }

        if ("config"in kw and kw["config"]) or self.first_config:
            if self.first_config:
                self.first_config=False
                self.inp = 1
                self.samples = 201
                self.delay = 200

            if 'input' in kw and kw['input']:
                # sets the input according to parameters
                input=kw['input']
                if input in expeyes_inputs:
                    input=expeyes_inputs[input]
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
        return
        
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
        return

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
        return
    
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
        return
    
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
        if 'mode' in kw:
            mode=kw['mode']
        else:
            mode='ascii'
        if mode=="ascii":
            ## define response headers
            cherrypy.response.headers["Content-Type"]="text/ascii;charset=utf-8"
            ## this one needs a fix !!!
            filename="values-{0}.txt".format(time.strftime("%Y-%m-%d_%H:%M:%S"))
            print("The file name should be:",filename)
            cherrypy.response.headers["File-Name"]=filename
            
            if self.mtype=='t,v':
                result=""
                t,v = self.measurements
                for i in range(len(t)):
                    result+="{0:f} {1:f}\n".format(t[i], v[i])
                return result
            else:
                return "mode = '%s', measurement type '%s' not supported." %(mode, self.mtype)
        return "non-supported mode %s" %mode
    
		
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
    app=None # global variable
    startServer()
    
# Local Variables:
# mode: Python
# python-indent: 4
# End:
