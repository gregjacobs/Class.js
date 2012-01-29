new Ext.test.TestSuite({
  /* testSuite name */
    name : 'Nested Test Suites Sample 3'	 
  , items : [{
       ttype : 'testcase'
     , name  : 'A silly Test Case at Lvl 0'
     , testZero : function(){
         Y.Assert.isNull(null, 'Blah!');
     }
    },{
       ttype : 'testsuite' /* important the type of item (testcase for testcase) */
     , name  : 'Test Suite at Lvl 0'
     , items : [{
           ttype : 'testcase'
         , name  : 'A silly Test Case at Lvl 1'
         , testOne: function(){
             Y.Assert.isNull(null, 'Blah!');
         }
      }]
  }]
});
