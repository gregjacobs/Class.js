/*global require, module */
/*jshint devel:true, latedef:false */
var execFile = require( 'child_process' ).execFile;

module.exports = function( grunt ) {

	// Register main tasks
	grunt.registerTask( 'default', "Default task runs JSHint and then builds the project.", [ 'build' ] );
	grunt.registerTask( 'build', "Builds the distribution JavaScript files (Class.js, and Class.min.js)",
		[ 'jshint', 'concat:dist', 'uglify:dist' ] );
	grunt.registerTask( 'doc', "Builds the JavaScript documentation.", [ 'build', 'compileDocs' ] );
	
	
	// Register sub-tasks. These aren't meant to be called directly, but are used as part of the main tasks.
	grunt.registerTask( 'compileDocs', compileDocsTask );
	
	
	// -----------------------------------
	
	// Plugin Configurations
	
	var banner = [
		'/*!',
		' * Class.js',
		' * Version <%= pkg.version %>',
		' *',
		' * Copyright(c) 2013 Gregory Jacobs.',
		' * MIT Licensed. http://www.opensource.org/licenses/mit-license.php',
		' *',
		' * <%= pkg.homepage %>',
		' */\n'
	].join( '\n' );
	
	
	// Project configuration
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		
		jshint: {
			files: [ 'Gruntfile.js', 'src/**/*.js', 'tests/spec/**/*.js' ],
			
			options : {
				'smarttabs' : true,
				'undef'     : true,
				'browser'   : true
			}
		},
		
		
		concat : {
			'dist' : {
				options : {
					banner: banner
				},
				src  : [ 'src/Class.js' ],  // simply adding the banner
				dest : 'dist/Class.js'      // to the output file
			}
		},
		
		
		uglify : {
			'dist' : {
				options: {
					preserveComments : 'some'  // preserve license header comments
				},
				files : {
					'dist/Class.min.js' : [ 'dist/Class.js' ]
				}
			}
		}
	} );

	// These plugins provide the tasks.
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );

	
	
	// -----------------------------------
	
	// Other Functions / Tasks
	
	
	/**
	 * Compiles the JavaScript documentation JSDuck, as part of the 'doc' task.
	 * 
	 * Unfortunately, we can't use the 'grunt-jsduck' plugin because installing the JSDuck gem on Windows
	 * using `gem install` first involves a long set of installation steps to install the developer build 
	 * tools needed to be able to compile the Ruby extensions needed by JSDuck's dependent libraries.
	 * 
	 * Hence, it is much easier for developers to get set up by not doing anything at all (i.e., simply
	 * running the packaged JSDuck executable in the repository).
	 */
	function compileDocsTask() {
		var done = this.async();
		
		var executable = 'vendor/jsduck/jsduck-4.4.1.exe';
		var args = [
			'--output=docs',
			'--title=Class.js API Docs',
			
			'src/'
		];
		
		execFile( executable, args, function( err, stdout, stderr ) {
			if( stdout ) console.log( stdout );
			if( stderr ) console.log( stderr );
			
			if( err ) {
				// JSDuck command itself failed
				grunt.log.error( "Documentation generation failed: " + err );
				
				done( false );
				return;
			}
			
			if( stdout || stderr ) {
				// JSDuck produced errors/warnings
				grunt.log.error( "Documentation generation produced warnings/errors. Please fix them, and try again." );
				
				done( false );
				return;
			}
			
			grunt.log.writeln( "Documentation generated successfully." );
			grunt.log.writeln( "To publish the docs on github, copy the /docs folder into a checkout of the gh-pages branch, commit, and push that branch." );
			done();
		} );
	}
	
};
