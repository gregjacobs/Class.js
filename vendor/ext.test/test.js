/**
 * @class Ext.test.Test
 * Simple wrapper class for encapsulating individual tests within a TestCase
 *
 * @param {String} name The name of the test
 * @param {Ext.test.TestCase} testCase The TestCase that this test belongs to.
 * @param {Function} fn The test's function.
 */
/*global Ext */
Ext.test.Test = function( name, testCase, fn ) {
	if( !name || typeof name !== 'string' ) { throw new Error( "'name' arg required for Ext.test.Test constructor" ); }
	if( !(testCase instanceof Ext.test.TestCase) ) { throw new Error( "'testCase' arg for Ext.test.Test constructor must be an Ext.test.TestCase" ); }
	if( typeof fn !== 'function' ) { throw new Error( "'fn' arg for Ext.test.Test constructor must be a function" ); }
	
	this.name = name;
	this.testCase = testCase;
	this.fn = fn;
};