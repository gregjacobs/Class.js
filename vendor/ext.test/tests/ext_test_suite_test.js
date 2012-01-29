new Ext.test.TestSuite({
	  name: 'Ext.test.TestSuite',
	  defaults: {
	      configTestSuite : {
	          name: 'testsuite_1',
	          defaults: {
                EXTJS_ROCKS: true,
                IE_6_IS_NOT_EVIL: false
            },
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
        name : 'Default configuration after instanciation.',
        // test if Ext.test.TestSuite is correctly instanciated
        testDefaultConfiguration: function() {
            Y.Assert.isString(this.testSuite.name, 'testSuite: name');
            Y.Assert.isArray(this.testSuite.items, 'testSuite: items');
            Y.ObjectAssert.areEqual({}, this.testSuite.defaults, 'testSuite: defaults');
            Y.ObjectAssert.areEqual(this.testSession, this.testSuite.testSession, 'testSuite: testSession');
        }
       },{
        name: 'Constructor and Methods.',   
        // test defaults config option   
        testDefaults: function() {
            Y.ObjectAssert.hasKeys(['EXTJS_ROCKS', 'IE_6_IS_NOT_EVIL'], this.testSuite2, 'testSuite2: properties');
            Y.Assert.isTrue(this.testSuite2['EXTJS_ROCKS'],'testSuite2: EXTJS_ROCKS is true');
            Y.Assert.isFalse(this.testSuite2['IE_6_IS_NOT_EVIL'],'testSuite2: IE_6_IS_NOT_EVIL is false');
            Y.ObjectAssert.hasKeys(['EXTJS_ROCKS', 'IE_6_IS_NOT_EVIL'], this.testCase, 'testCase: properties');
            Y.Assert.isTrue(this.testCase['EXTJS_ROCKS'],'testCase: EXTJS_ROCKS is true');
            Y.Assert.isFalse(this.testCase['IE_6_IS_NOT_EVIL'],'testCase: IE_6_IS_NOT_EVIL is false');
        },
        // test session registering and parentSuite property
        testSessionRegisterAndParents: function() {
            var ts = this.testSession.findSuite(this.testSuite.name);
            Y.ObjectAssert.areEqual(this.testSuite, ts, 'testSuite: registered in session');
            Y.ObjectAssert.areEqual(this.testSession.getMasterSuite(), ts.parentSuite, 'testSuite: master is parent suite');
            var ts2 = this.testSession.findSuite(this.testSuite2.name);
            Y.ObjectAssert.areEqual(this.testSuite2, ts2, 'testSuite2: registered in session');
            Y.ObjectAssert.areEqual(this.testSuite, ts2.parentSuite, 'testSuite2: parent suite');
            var tc = this.testSession.findCase(this.testCase.name);
            Y.ObjectAssert.areEqual(this.testCase, tc, 'testSuite2: registered in session');
            Y.ObjectAssert.areEqual(this.testSuite, tc.parentSuite, 'testCase: parent suite');
        },
        // test getTestCaseCount and getTestSuiteCount methods
        testCounts: function(){
            Y.Assert.areSame(1,this.testSuite.getTestCaseCount(), 'testSuite1: count testcases');
            Y.Assert.areSame(1,this.testSuite.getTestSuiteCount(), 'testSuite1: count testsuites');
            Y.Assert.areSame(0,this.testSuite2.getTestCaseCount(), 'testSuite2: count testcases');
            Y.Assert.areSame(0,this.testSuite2.getTestSuiteCount(), 'testSuite2: count testsuites');
        },
        // test cascade method
        testCascade: function(){
            var callScope,
                callCount = 0;
            this.testSuite.cascade(function(i){
                callScope = this
                callCount++;
            }, this);
           Y.Assert.areEqual(3, callCount, 'testCascade: call count');
           Y.Assert.areSame(this, callScope, 'testCascade: scope');
        }
    }]
});
