/*global window, Class */

// NOTE: This source file is wrapped in a UMD block / factory function when built, 
//       so these are not global.

/**
 * @class Class.Util
 * @singleton
 * 
 * A few utility functions for Class.js
 */
var Util = Class.Util = {
	
	/**
	 * Assigns (shallow copies) the properties of `src` onto `dest`.
	 * 
	 * @param {Object} dest The destination object.
	 * @param {...Object} src The source object(s). They are processed in order from left to right.
	 * @return {Object} The destination object.
	 */
	assign : function( dest ) {
		var srcObjects = Array.prototype.slice.call( arguments, 1 );
		
		for( var i = 0, len = srcObjects.length; i < len; i++ ) {
			var srcObj = srcObjects[ i ];
			
			for( var prop in srcObj ) {
				if( srcObj.hasOwnProperty( prop ) ) {
					dest[ prop ] = srcObj[ prop ];
				}
			}
		}
		return dest;
	},
	
	
	/**
	 * Determines if a value is an object.
	 * 
	 * @param {Mixed} value
	 * @return {Boolean} `true` if the value is an object, `false` otherwise.
	 */
	isObject : function( value ) {
		return !!value && Object.prototype.toString.call( value ) === '[object Object]';  
	},
	
	
	
	/**
	 * Determines if on Internet Explorer, for dealing with IE's toString() problem.
	 * 
	 * @return {Boolean} `true` if the browser is IE, `false` otherwise.
	 */
	isIe : (function() {
		var isIe = false;
		if( typeof window !== 'undefined' && window.navigator && window.navigator.userAgent ) {
			var uA = window.navigator.userAgent.toLowerCase();
			isIe = /msie/.test( uA ) && !( /opera/.test( uA ) );
		}
		
		return function() { return isIe; };
	})()
	
};