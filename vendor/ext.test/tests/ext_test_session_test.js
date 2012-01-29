new Ext.test.TestSuite({
	  name: 'Ext.test.Session',
	  defaults: {
	      configTestSuite : {
	          name: 'testsuite_1',
	          items: [{
                ttype: 'testsuite',
                name: 'testsuite_2'
            },{
                name: 'testcase'
            }]
	      },
	       // call before each tests
        setUp: function() {
            this.testSession = new Ext.test.Session();
            var conf = Ext.apply(this.configTestSuite, {
                testSession : this.testSession
            });
            this.testSuite = new Ext.test.TestSuite(conf);
            this.testSuite2 = this.testSuite.items[0];
            this.testCase = this.testSuite.items[1];
		    }, 
		     // call after each tests 
	  		tearDown: function() {
            this.testSession.destroy();
            delete this.testSession;
            delete this.testSuite;
            delete this.testSuite2;
            delete this.testCase;
        }
	  },
    items: [{
        name : 'Test Master Suite.',
        // test if session master suite is correctly instanciated
        testDefaultConfiguration: function() {
            var ms = this.testSession.getMasterSuite();
            Y.Assert.isInstanceOf(Ext.test.TestSuite, ms, 'masterSuite: instanceof');
            Y.Assert.isTrue(ms.disableRegister,'masterSuite: disableRegister');
            Y.ObjectAssert.areEqual(this.testSession, ms.testSession, 'masterSuite: testSession');
        }
       },{
        name : 'Test Finds.',
        // test findSuite method
        testFindSuite: function() {
            var ts = this.testSession.findSuite('testsuite_2');
            Y.ObjectAssert.areEqual(this.testSuite2, ts, 'findSuite: testsuite_2');
        },
        // test findCase method
        testFindCase: function() {
            var tc = this.testSession.findCase('testcase');
            Y.ObjectAssert.areEqual(this.testCase, tc, 'findCase: testcase');
        }
       },{
        name: 'Test registerCase and registerSuite.',
        // test registerCase method and registercase event
        testRegisterCase: function(){
            var args,
                tc;
            this.testSession.on('registercase', function(){
               args = arguments;
            },this);
            tc = new Ext.test.TestCase({
               testSession: this.testSession,
               name: 'test_case2'
            });
            Y.Assert.isNotUndefined(args, 'registersuite: is fired');
            Y.Assert.areEqual(2, args.length, 'registercase: params count');
            Y.ObjectAssert.areEqual(this.testSession, args[0], 'registercase: testSession');
            Y.ObjectAssert.areEqual(tc, args[1], 'registercase: testCase');
            delete tc;
        },
        // test registerSuite method and registersuite event
        testRegisterSuite: function(){
            var args,
                ts;
            this.testSession.on('registersuite', function(){
                args = arguments;
            },this);
            ts = new Ext.test.TestSuite({
               testSession: this.testSession,
               name: 'test_suite3'
            });
            Y.Assert.isNotUndefined(args, 'registersuite: is fired');
            Y.Assert.areEqual(2, args.length, 'registersuite: params count');
            Y.ObjectAssert.areEqual(this.testSession, args[0], 'registersuite: testSession');
            Y.ObjectAssert.areEqual(ts, args[1], 'registersuite: testSuite');
            delete ts;
        }
       },{
         name: 'Test ExtJS 3.2.1 Compat.',
         // test addTest method
         testAddTest: function(){
            this.testSession.addTest('testsuite_1', {
              name: 'test_case3'
            });
            var tc3 = this.testSession.findCase('test_case3');
            Y.Assert.isInstanceOf(Ext.test.TestCase, tc3, 'addTest: instanceof');
            Y.ObjectAssert.areEqual(this.testSuite, tc3.parentSuite, 'addTest: test_case3');
            delete tc3;
        },
        // test getSuite method
        testGetSuite: function(){
            var ts = this.testSession.getSuite('testsuite_1');
            Y.ObjectAssert.areEqual(this.testSuite, ts, 'getSuite: test_case3');
            var ts_auto_created = this.testSession.findSuite('testsuite_auto_created');
            Y.Assert.isUndefined(ts_auto_created, 'getSuite: undefined auto_create');
            ts_auto_created = this.testSession.getSuite('testsuite_auto_created');
            Y.Assert.isInstanceOf(Ext.test.TestSuite, ts_auto_created, 'getSuite: instanceof');
            Y.Assert.areEqual('testsuite_auto_created', ts_auto_created.name ,'getSuite: testsuite_auto_created');
            delete ts_auto_create;
        }
       }]
});
