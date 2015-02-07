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

    def index(self):
	"""
        features the home page
        @return an HTML file with all necessary JS libraries included,
        """
        with open("templates/index-vml.html","r") as webpage:
            return webpage.read()

    index.exposed = True


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
    reconnect.exposed=True

    def oneScopeChannel(self, **kw):
        """
        This method launches a series of measurements made at one analog
        input and returns their values.
        @param kw dictionary of keywords. Allowed keywords are:
        - input:    integer, selects an analog input; defaults to 1 (channel A1)
        - samples:  integer, number of samples; defaults to 201 (200 intervals)
        - delay:    integer, delay in microsecond between two samples;
          defaults to 200 (200 * 200 microseconds= 40 ms)
        - duration: float, total time span of the measurements in second
        By default, measures voltage at input A1, 201 samples spanning 40 ms.
        If the keyword 'duration' is used, it will redefine the value of
        delay, which is 200 microseconds by default.
        @return measurement values
        """
        # default values
        inp = 1
        samples = 201
        delay = 200
        
        if 'input' in kw: inp=kw['input']
        if 'samples' in kw: samples=kw['samples']
        if 'delay' in kw: delay=kw['delay']
        if 'duration' in kw: delay=int(1000000*kw['duration']/(samples-1))

        self.mtype = 't,v' # two arrays, first for time, second for voltage
        if self.hw_lock:
            return json.dumps(self.oldMeasurements)
        self.hw_lock=True
        self.oldMeasurements=self.measurements # backups old data
        self.measurements = self.device.capture(inp, samples, delay)
        self.hw_lock=False
        return json.dumps(self.measurements)
    oneScopeChannel.exposed=True

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
    
    getValues.exposed=True

		
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
