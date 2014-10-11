/*global require, module */
/*jshint devel:true, latedef:false */
var execFile = require( 'child_process' ).execFile;

module.exports = function( grunt ) {

	// Register Tasks
	grunt.registerTask( 'default', [ 'jshint', 'build', 'jasmine' ] );
	grunt.registerTask( 'build', [ 'concat:development', 'uglify:production' ] );
	grunt.registerTask( 'doc', "Builds the documentation.", [ 'jshint', 'build', 'jsduck' ] );
	
	
	// Plugins Configurations
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-jasmine' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-jsduck' );
	
	
	// -----------------------------------
	
	
	// Project Configuration
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		
		jshint: {
			files: {
				src: [ 'Gruntfile.js', 'src/**/*.js', 'tests/spec/**/*.js' ]
			}
		},
		
		jasmine: {
			dist: {
				options: {
					specs: 'tests/**/*Spec.js'
				},
				src: 'dist/Class.min.js'  // test the minified file
			}
		},
		
		concat: {
			'development' : {
				options: {
					banner : createBanner() + createDistFileHeader(),
					footer : createDistFileFooter(),
					nonull : true,
					
					process : function( src, filepath ) {
						return '\t' + src.replace( /\n/g, '\n\t' );  // indent each source file, which is placed inside the UMD block
					}
				},
				src: [
					'src/Class.js',
					'src/ClassBuilder.js',
					'src/Util.js'
				],
				dest: 'dist/Class.js'
			}
		},
		
		uglify : {
			'production' : {
				options: {
					preserveComments : 'some'  // preserve license header comments
				},
				files : {
					'dist/Class.min.js' : [ 'dist/Class.js' ]
				}
			}
		},
		
		jsduck: {
			main: {
				src: [
					'src/**/*.js'
				],
				dest: 'docs',  // output dir
		
				options: {
					'title': 'Class.js API Docs'
				}
			}
		}
	} );

	
	// -----------------------------------
	
	// Other Functions / Tasks
	
	
	/**
	 * Creates the banner comment with license header that is placed over the concatenated/minified files.
	 * 
	 * @private
	 * @return {String}
	 */
	function createBanner() {
		return [
			'/*!',
			' * Class.js',
			' * Version <%= pkg.version %>',
			' *',
			' * Copyright(c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> <<%= pkg.author.email %>>',
			' * <%= pkg.license %>',
			' *',
			' * <%= pkg.homepage %>',
			' */\n'
		].join( "\n" );
	}
	
	
	/**
	 * Creates the UMD (Universal Module Definition) header, which defines Class as one of the following when loaded:
	 * 
	 * 1. An AMD module, if an AMD loader is available (such as RequireJS)
	 * 2. A CommonJS module, if a CommonJS module environment is available (such as Node.js), or
	 * 3. A global variable, `Class`, if the others are unavailable.
	 * 
	 * This UMD header is combined with the UMD footer to create the distribution JavaScript file.
	 * 
	 * @private
	 * @return {String}
	 */
	function createDistFileHeader() {
		return [
			";( function( root, factory ) {",  // note: prefixed ';' if Class.js is concatenated after a library that does not end in a ';' itself
				"\tif( typeof define === 'function' && define.amd ) {",
					"\t\tdefine( factory );             // Define as AMD module if an AMD loader is present (ex: RequireJS).",
				"\t} else if( typeof exports !== 'undefined' ) {",
					"\t\tmodule.exports = factory();    // Define as CommonJS module for Node.js, if available.",
				"\t} else {",
					"\t\troot.Class = factory();        // Finally, define as a browser global if no module loader.",
				"\t}",
			"}( this, function() {\n\n"
		].join( "\n" );
	}
	
	
	/**
	 * Creates the UMD (Universal Module Definition) footer. See {@link #createDistFileHeader} for details.
	 * 
	 * @private
	 * @return {String}
	 */
	function createDistFileFooter() {
		var umdEnd = [
				'\n\n\treturn Class;\n',
			'} ) );'
		];
		
		return umdEnd.join( "\n" );
	}
	
};
