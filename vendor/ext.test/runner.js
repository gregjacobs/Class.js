/**
 * @class Ext.test.Runner
 * An Observable that manage the YUI Test Runner
 * @extends Ext.util.Observable
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
/*global Ext, Y */
Ext.test.Runner = Ext.extend( Ext.util.Observable, {
  /**
	 * @cfg {Ext.test.Session} testSession (defaults to Ext.test.session) The 
	 * default instanciated Ext.test.Session used by this Ext.test.Runner.
	 */
	
	testSession: Ext.test.Session,
	constructor: function() {
		Ext.test.Runner.superclass.constructor.apply(this, arguments);
		
		this.addEvents(
			/**
			 * @event beforebegin
			 * Fires before the test runner begins.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'beforebegin',
			
			/**
			 * @event begin
			 * Fires when the test runner begins.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'begin',
			
			/**
			 * @event complete
			 * Fires when the test runner has finished.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'complete',
			
			/**
			 * @event pass
			 * Fires when a test passes.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'pass',
			
			/**
			 * @event fail
			 * Fires when a test fails.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'fail',
			
			/**
			 * @event ignore
			 * Fires when a test is ignored.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'ignore',
			
			/**
			 * @event testcasebegin
			 * Fires when a TestCase begins.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'testcasebegin',
			
			/**
			 * @event testcasecomplete
			 * Fires when a TestCase has finished.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'testcasecomplete',
			
			/**
			 * @event testsuitebegin
			 * Fires when a TestSuite begins.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'testsuitebegin',
			
			/**
			 * @event testsuitecomplete
			 * Fires when a TestSuite has finished.
			 * @param {Ext.test.Runner} runner This Ext.test.Runner object.
			 * @param {Object} event The runner event.
			 */
			'testsuitecomplete'
		);
		this.monitorYUITestRunner();
	},
	
	
	// YUI TestRunner events
	monitorYUITestRunner: function() {
			var r = Y.Test.Runner;
			r.disableLogging();
			var fn = this.onTestRunnerEvent;
			r.subscribe("begin", fn, this, true);
			r.subscribe("complete", fn, this, true);
			r.subscribe("fail", fn, this, true);
			r.subscribe("ignore", fn, this, true);
			r.subscribe("pass", fn, this, true);
			r.subscribe("testcasebegin", fn, this, true);
			r.subscribe("testcasecomplete", fn, this, true);
			r.subscribe("testsuitebegin", fn, this, true);
			r.subscribe("testsuitecomplete", fn, this, true);
			this.runner = r;
	},
	
	// handle YUI TestRunner events
	onTestRunnerEvent: function(e) {
			var type = e.type;
			// Master Suite event drop
			if (type == 'testsuitebegin' && e.testSuite.name == this.runner.getName()){
					return;
			}
			this.fireEvent(type, this, e);
	},
	
	/**
	 * Runs registered testCases and testSuites.
	 */
	run: function() {
			this.fireEvent('beforebegin', this);
			var master_suite = this.testSession.getMasterSuite();
			this.runner.add(master_suite);
			this.runner.run(true);
	},
	
	/**
	 * Removes all test objects. 
	 */
	clear: function(){
		this.runner.clear();
	},
	
	/**
	 * Unsubscribe runner events and purge all listeners in Ext.test.Runner. 
	 */
	destroy: function() {
		this.runner.unsubscribeAll();
		this.purgeListeners();
	}
} );

// Overwrite class with static (singleton) instance
Ext.test.Runner = new Ext.test.Runner();
