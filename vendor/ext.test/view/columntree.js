/**
 * @class Ext.test.view.ColumnTree
 * A ColumnTree that show test registered in Ext.test.Session. 
 * Based on Ext.ux.tree.ColumnTree sample.
 * @extends Ext.tree.TreePanel
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
/*global Ext */
Ext.test.view.ColumnTree = Ext.extend(Ext.tree.TreePanel, {
	
	// This ColumnTree's configs
	useArrows: true,
	//header: true,	Note: causes error in Ext 3.1.1
	passText: 'Passed',
	failText: 'Failed!',
	ignoreText: '(Ignored)',
	autoScroll: true,
	rootVisible: false,
	lines : false,
	
	borderWidth : Ext.isBorderBox ? 0 : 2, // the combined left/right border for each cell
	cls : 'x-column-tree',
	
	
	initComponent: function() {
		
		Ext.apply( this, Ext.apply( this.initialConfig, {
			root: new Ext.tree.TreeNode( {
				expanded: true
			} ),
			
			columns: [
				{
					dataIndex: 'name',
					header: 'Name',
					id: 'name',
					width: 500,
					renderer: function(val, node) {
						var qtip = '';
						var err = node.attributes['errors'];
						if (err != '') {
								qtip = 'ext:qtip="' + err + '"';
						}
						return '<span '+qtip+'>' + val + '</span>';
					}
				},{
					dataIndex: 'state',
					header: 'State',
					id: 'state',
					renderer: function(val, node) {
						var color = '#000';
						if (val == node.ownerTree.passText) {
								color = "#00FF00";
						} else if (val == node.ownerTree.failText) {
								color = '#FF0000';
						}
						return '<span style="color: ' + color + ';font-weight: bold;">' + val + '</span>';
					},
					width: 75
				}, 
				{ dataIndex: 'passed', header: 'Passed', width: 50 }, 
				{ dataIndex: 'failed', header: 'Failed', width: 50 }, 
				{ dataIndex: 'ignored', header: 'Ignored', width: 50 }, 
				{ dataIndex: 'message', header: 'Message', width: 800 }
			]
		} ) );  // eo apply config
		
		
		// Monitor the test runner
		var fn = this.onTestRunnerEvent;
		var runner = Ext.test.Runner;
		this.mon( runner, 'begin', fn, this );
		this.mon( runner, 'complete', fn, this );
		this.mon( runner, 'fail', fn, this );
		this.mon( runner, 'pass', fn, this );
		this.mon( runner, 'ignore', fn, this );
		this.mon( runner, 'testcasebegin', fn, this );
		this.mon( runner, 'testcasecomplete', fn, this );
		this.mon( runner, 'testsuitebegin', fn, this );
		this.mon( runner, 'testsuitecomplete', fn, this );
		this.mon( runner, 'beforebegin', this.resetNodes, this );
		
		// Call the superclass initComponent
		Ext.test.view.ColumnTree.superclass.initComponent.apply( this, arguments );
	},
	
	
	// See columnTree example for this
	onRender: function() {
		Ext.test.view.ColumnTree.superclass.onRender.apply(this, arguments);
		
		this.colheaders = this.bwrap.createChild( {
			cls: 'x-tree-headers'
		}, this.bwrap.dom.lastChild );
		
		var cols = this.columns,
		    c;
		for (var i = 0, len = cols.length; i < len; i++) {
			c = cols[i];
			this.colheaders.createChild({
				cls: 'x-tree-hd ' + (c.cls ? c.cls + '-hd': ''),
				cn: {
					cls: 'x-tree-hd-text',
					html: c.header
				},
				style: 'width:' + (c.width - this.borderWidth) + 'px;'
			});
		}
		this.colheaders.createChild({
			cls: 'x-clear'
		});
		
		// prevent floats from wrapping when clipped
		this.colheaders.setWidth( 'auto' );
		this.createTree();
	},
	
	
	// private create tree for Ext.test.Session
	createTree: function() {
		var ms = Ext.test.Session.getMasterSuite();
		
		ms.cascade( function( t ) {
			if( t === ms ) { 
				this.addSuiteNode( ms, this.root, true );
				
			} else if(!t.parentSuite){
				if( t instanceof Ext.test.TestSuite ) {
					this.addSuiteNode(t);
				} else if(t instanceof Ext.test.TestCase){
					this.addCaseNode(t);
				} else {
					// Individual tests
					var caseNode = this.getCaseNode( t.testCase );
					this.addTestNode(t,caseNode);
				}
				
			} else {
				var sn = this.getSuiteNode(t.parentSuite);
				if (t instanceof Ext.test.TestCase){
					this.addCaseNode(t,sn);
				} else {
					this.addSuiteNode(t,sn);
				}
			}
		}, this);
	},
	
	
	
	// private reset TreeNode attributes before a run
	resetNodes: function() {
		var attr, ui;
		this.root.cascade( function(node) {
			if (node != this.root) {
				attr = node.attributes;
				ui = node.ui;
				attr['passed'] = '';
				attr['failed'] = '';
				attr['ignored'] = '';
				attr['errors'] = '';
				attr['state'] = '';
				attr['message'] = '';
				//if( attr['type'] == 'testSuite' ) {
					ui.setIconElClass('x-tree-node-icon');
				//}
				ui.refresh();
			}
		}, this );
	},
	
		
	/**
	 * Creates an Ext.test.TestSuite node.
	 * @param {Ext.test.TestSuite} ts The TestSuite
	 * @return {Ext.tree.TreeNode} The Ext.tree.TreeNode
	 */
	createSuiteNode: function(ts, expanded) {
		return new Ext.tree.TreeNode( {
			name: ts.name,
			testSuite: ts,
			uiProvider: Ext.test.view.uiProvider,
			type: 'testSuite',
			expanded: expanded,
			state: '',
			passed: '',
			failed: '',
			ignored: '',
			errors: '',
			message: ''
		} );
	},
	
	
	/**
	 * Creates an Ext.test.TestSuite node and adds it to a parent Ext.tree.TreeNode.
	 * @param {Ext.test.TestSuite} ts The Ext.test.TestSuite
	 * @param {Ext.tree.TreeNode} pnode The parent node
	 */
	addSuiteNode: function(ts, pnode, expanded) {
		pnode = pnode || this.root;
		var oldn = this.getSuiteNode(ts);
		if (oldn) {
			oldn.remove(true);
		}
		var n = this.createSuiteNode(ts, expanded);
		pnode.appendChild(n);
	},
	
		
	/**
	 * Creates an Ext.test.TestCaseNode.
	 * @param {Ext.test.TestCase} tc The TestCase
	 * @return {Ext.tree.TreeNode} The Ext.tree.TreeNode
	 */
	createCaseNode: function( tc ) {
		return new Ext.tree.TreeNode( {
			name: tc.name,
			testCase: tc,
			uiProvider: Ext.test.view.uiProvider,
			type: 'testCase',
			state: '',
			passed: '',
			failed: '',
			ignored: '',
			errors: '',
			message: ''
		} );
	},
	
		
	/**
	 * Creates an Ext.test.TestCase node and adds it to a parent Ext.tree.TreeNode.
	 * @param {Ext.test.TestCase} ts The Ext.test.TestCase
	 * @param {Ext.tree.TreeNode} pnode The parent Ext.tree.TreeNode
	 */
	addCaseNode: function(tc, pnode) {
		pnode = pnode || this.root;
		var n = this.createCaseNode(tc);
		pnode.appendChild(n);
	},
		
		
	/**
	 * Creates a Tree Node for an individual Test
	 * @param {Ext.test.Test} t The Test object
	 * @return {Ext.tree.TreeNode} The Ext.tree.TreeNode
	 */
	createTestNode: function( t ) {
		return new Ext.tree.TreeNode( {
			name: t.name,
			test: t,
			uiProvider: Ext.test.view.uiProvider,
			type: 'test',
			state: '',
			passed: '',
			failed: '',
			ignored: '',
			errors: '',
			message: ''
		} );
	},
	
		
	/**
	 * Creates an Ext.test.TestCase node and adds it to a parent Ext.tree.TreeNode.
	 * @param {Ext.test.TestCase} ts The Ext.test.TestCase
	 * @param {Ext.tree.TreeNode} pnode The parent Ext.tree.TreeNode
	 */
	addTestNode: function(tc, pnode) {
		pnode = pnode || this.root;
		var n = this.createTestNode(tc);
		pnode.appendChild(n);
	},
	
	
	// -----------------------------
	
	
	/**
	 * Gets a TestSuite node by its name.
	 * @param {Ext.test.TestSuite} testSuite The TestSuite
	 * @return {Ext.tree.TreeNode} The Ext.tree.TreeNode, or undefined
	 */
	getSuiteNode: function( testSuite ) {
		// NOTE: Optimization causes an error... for whatever reason
		//if( testSuite.__treeNode ) {
		//	return testSuite.__treeNode;
			
		//} else {
			var n;
			this.root.cascade( function(node) {
				if( node.attributes.testSuite === testSuite ) {
					n = node;
					return false;
				}
			}, this );
			
			// Store the node on the TestSuite object itself, so we don't have to do the cascade
			// again for other events
		//	testSuite.__treeNode = n;
			return n;
		//}
	},
	
	
	/**
	 * Gets an Ext.test.TestCase node by its name.
	 * @param {Ext.test.TestCase} testCase The TestCase
	 * @return {Ext.tree.TreeNode} The node, or undefined.
	 */
	getCaseNode: function( testCase ) {
		// NOTE: Optimization causes an error... for whatever reason
		//if( testCase.__treeNode ) {
		//	return testCase.__treeNode;
			
		//} else {
			var n;
			this.root.cascade( function(node) {
				if( node.attributes.testCase === testCase ) {
					n = node;
					return false;
				}
			}, this );
			
			// Store the node on the TestCase object itself, so we don't have to do the cascade
			// again for other events
		//	testCase.__treeNode = n;
			return n;
		//}
	},
	
	
	/**
	 * Gets an Ext.test.Test node by its name.
	 * @param {Ext.tree.TreeNode} caseNode The Ext.tree.TreeNode for the TestCase that encapsulated the test to search for.
	 * @param {String} name The name of the Ext.test.Test
	 * @return {Ext.tree.TreeNode} The node, or undefined.
	 */
	getTestNode: function(caseNode, name) {
		/*if( !caseNode.__tests ) {
			caseNode.__tests = {};
		}
		
		if( caseNode.__tests[ name ] ) {
			return caseNode.__tests[ name ];
			
		} else {
			var n;
			caseNode.cascade( function( node ) {
				var attr = node.attributes;
				if( attr.type == 'test' && attr.name === name ) {
					n = node;
					return false;
				}
			}, this );
			
			// Store the node on the caseNode object itself, so we don't have to do the cascade
			// again for other events
			caseNode.__tests[ name ] = n;
			return n;
		}*/
		
		var n;
		caseNode.cascade( function( node ) {
			var attr = node.attributes;
			if( attr.type == 'test' && attr.name === name ) {
				n = node;
				return false;
			}
		}, this );
		return n;
	},
	
	
	// private handle test runner events
	onTestRunnerEvent: function(runner, event) {
		var node, caseNode, res;

		switch( event.type ) {
			case "fail":
				caseNode = this.getCaseNode(event.testCase);
				caseNode.attributes['state'] = this.failText;
				caseNode.ui.setIconElClass('testcase-failed');
				caseNode.attributes['errors'] = event.error.getMessage();
				caseNode.ui.refresh();
				
				node = this.getTestNode( caseNode, event.testName );
				node.attributes['state'] = this.failText;
				node.ui.setIconElClass('testcase-failed');
				node.attributes['errors'] = event.error.getMessage();
				node.attributes['message'] = event.error.getMessage();
				node.ui.refresh();
				break;
				
			case "pass":
				caseNode = this.getCaseNode(event.testCase);				
				node = this.getTestNode( caseNode, event.testName );
				node.attributes['state'] = this.passText;
				node.ui.setIconElClass('testcase-passed');
				node.ui.refresh();
				break;
				
			case "ignore":
				caseNode = this.getCaseNode(event.testCase);				
				node = this.getTestNode( caseNode, event.testName );
				node.attributes['state'] = this.ignoreText;
				//node.ui.setIconElClass('testcase-passed');
				node.ui.refresh();
				break;
				
			case "testcasebegin":
				node = this.getCaseNode(event.testCase);
				node.attributes['state'] = 'Running...';
					node.ui.setIconElClass('testcase-running');
				node.ui.refresh();
				break;
			case "testcasecomplete":
				node = this.getCaseNode(event.testCase);
				res = event.results;
				if (res.failed === 0) {
					node.attributes['state'] = this.passText;
					node.ui.setIconElClass('testcase-passed');
				}
				node.attributes['passed'] = res.passed;
				node.attributes['failed'] = res.failed;
				node.attributes['ignored'] = res.ignored;
				node.ui.refresh();
				break;
			case "testsuitebegin":
				node = this.getSuiteNode(event.testSuite);
				node.ui.setIconElClass('testsuite-running');
				node.ui.refresh();
				break;
			case "testsuitecomplete":
				node = this.getSuiteNode(event.testSuite);
				res = event.results;
				if (res.failed === 0) {
						node.attributes['state'] = this.passText;
						node.ui.setIconElClass('testsuite-passed');
				}
				if (res.failed > 0) {
						node.attributes['state'] = this.failText;
						node.ui.setIconElClass('testsuite-failed');
				}
				node.attributes['passed'] = res.passed;
				node.attributes['failed'] = res.failed;
				node.attributes['ignored'] = res.ignored;
				node.ui.refresh();
				break;
		}
	}
	
});

Ext.reg('testtree', Ext.test.view.ColumnTree);
