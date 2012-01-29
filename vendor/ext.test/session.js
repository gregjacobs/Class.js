/**
 * @class Ext.test.Session
 * The Test Session Class. 
 * @extends Ext.util.Observable
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
/*global Ext */
Ext.test.Session = Ext.extend( Ext.util.Observable, {
	
	// Add some events
	constructor: function( config ) {
		Ext.apply( this, config );
		Ext.test.Session.superclass.constructor.apply(this, arguments);
		
		this.addEvents(
			/**
			 * @event registersuite
			 * Fires after a Ext.test.TestSuite is registered in this Ext.test.Session.
			 * @param {Ext.test.Session} session This Ext.test.Session instanciated object.
			 * @param {Ext.test.TestSuite} tsuite The Ext.test.TestSuite.
			 */
			'registersuite',
			
			/**
			 * @event registercase
			 * Fires after a Ext.test.TestCase is registered in this Ext.test.Session.
			 * @param {Ext.test.Session} session This Ext.test.Session instanciated object.
			 * @param {Ext.test.TestCase} tsuite The Ext.test.TestCase.
			 */
			'registercase'
		);
			
		// Create the master suite
		this.masterSuite = new Ext.test.TestSuite( {
			name: document.title,
			disableRegister: true,
			testSession: this
		} );
	},
	
	
	/**
	 * Convenience for adding a Ext.test.TestSuite to this Ext.test.Session.
	 * 
	 * @method addSuite
	 * @param {String} name (optional) The name of the Ext.test.TestSuite. This may be omitted, and the TestSuite
	 *   provided as the first argument if the TestSuite is to be added to the main suite.
	 * @param {Ext.test.TestSuite/Object} testSuite The TestSuite, or anonymous object that defines the TestSuite.
	 */
	addSuite : function( name, testSuite ) {
		var parentSuite;
		if( typeof name === 'string' ) {
			parentSuite = this.getSuite( name );
		} else {
			// 'name' argument left out, assume name=testSuite
			testSuite = name;
			parentSuite = testSuite.parentSuite || this.masterSuite;
		}
		
		if( !(testSuite instanceof Ext.test.TestSuite) ) {
			// config object, add correct ttype for instantiation
			testSuite.ttype = "testsuite";
		}
		parentSuite.add( testSuite ); 
	},
	
	
	/**
	 * Adds a Ext.test.TestCase to this Ext.test.Session, adding it to a TestSuite. Accepts 
	 * an anonymous object as the TestCase, which will be converted into a TestCase instance.
	 * 
	 * @method addTest
	 * @param {String} name (optional) The name of the parent Ext.test.TestSuite. This may be omitted, and the TestCase
	 *   provided as the first argument if the TestCase is to be added to the main suite. If provided, and the name
	 *   does not yet exist, it will be created.
	 * @param {Ext.test.TestCase/Object} testCase The TestCase, or anonymous object that defines the TestCase.
	 */
	addTest: function( name, testCase ) {
		var parentSuite;
		if( typeof name === 'string' ) {
			parentSuite = this.getSuite( name );
		} else {
			// 'name' argument left out, assume name=testCase
			testCase = name;
			parentSuite = testCase.parentSuite || this.masterSuite;
		}
		parentSuite.add( testCase );
	},
	
	
	/**
	 * Gets an existing Ext.test.TestSuite by name, or create it if it doesn't exist yet.
	 * @param {String} name The name of the Ext.test.TestSuite
	 * @return {Ext.test.TestSuite} The Ext.test.TestSuite
	 */
	getSuite: function(name) {
		var t = this.findSuite(name);
		if (!t) {
			t = this.createSuite(name);
		}
		return t;
	},
	
	
	/**
	 * Creates an Ext.test.TestSuite.
	 * @param {String} name The name of the Ext.test.TestSuite
	 * @return {Ext.test.TestSuite} The Ext.test.TestSuite
	 */
	createSuite: function(name) {
		return new Ext.test.TestSuite( {
			name: name
		} );
	},
	
	
	/**
	 * Finds an Ext.test.TestSuite by name.
	 * @param {String} name The name of the Ext.test.TestSuite
	 * @return {Ext.test.TestSuite} The Ext.test.TestSuite, or null if the TestSuite is not registered.
	 */
	findSuite: function( name ) {
		var tsuite;
		this.masterSuite.cascade( function(t){
			if (t instanceof Ext.test.TestSuite && t.name == name){
				tsuite = t;
				return false;
			}
		},this );
		return tsuite;
	},
	
	
	/**
	 * Registers an Ext.test.TestSuite into this session.
	 * @param {Ext.test.TestSuite} testSuite The TestSuite to register.
	 */
	registerSuite: function(testSuite) {
		this.masterSuite.add( testSuite );
		this.fireEvent( 'registersuite', this, testSuite );
	},
	
	
	/**
	 * Registers an Ext.test.TestCase into this session.
	 * @param {Ext.test.TestCase} testCase The TestCase to register.
	 */
	registerCase: function( testCase ) {
		this.masterSuite.add( testCase );
		this.fireEvent( 'registercase', this, testCase );
	},
	
	
	/**
	 * Finds an Ext.test.TestCase by name.
	 * @param {String} name The name of the Ext.test.TestCase 
	 * @return {Ext.test.TestCase} The Ext.test.TestCase, or null if the TestCase is not registered.
	 */
	findCase: function(name) {
		var tcase;
		this.masterSuite.cascade( function(t){
			if (t instanceof Ext.test.TestCase && t.name == name){
				tcase = t;
				return false;
			}
		}, this );
		return tcase;
	},
	
	
	/**
	 * Gets the number of registered Ext.test.TestCase's in this Ext.test.Session.
	 * @return {Number} The number of TestCases.
	 */
	getTestCaseCount: function() {
		return this.masterSuite.getTestCaseCount();
	},
	
	
	/**
	 * Gets the number of registered Ext.test.TestSuite's in this Ext.test.Session.
	 * @return {Number} The number of TestSuites.
	 */
	getTestSuiteCount: function() {
		return this.masterSuite.getTestSuiteCount();
	},
	
		
	/**
	 * Gets the Ext.test.Session MasterSuite.
	 * @return {Ext.test.TestSuite} The Masteer Ext.test.TestSuite.
	 */
	getMasterSuite: function(){
		return this.masterSuite;
	},
	
	
	/**
	 * Destroys the Ext.test.Session.
	 */
	destroy: function(){
		this.purgeListeners();
	}
	
});


Ext.test.Session = new Ext.test.Session();
