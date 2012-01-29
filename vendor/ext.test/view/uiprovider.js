/**
 * @class Ext.test.view.uiProvider
 * A ColumnNodeUI with refresh support and icon changing capability.
 * Based Ext.ux.tree.ColumnNodeUI ExtJS 3.2.1 sample.
 * @extends Ext.tree.TreeNodeUI
 * @author  Nicolas FERRERO (aka yhwh) for Sylogix
 * @version 1.3
 * @date	June 4, 2010
 */
Ext.test.view.uiProvider = Ext.extend(Ext.tree.TreeNodeUI, {
    focus: Ext.emptyFn, // prevent odd scrolling behavior

    renderElements : function(n, a, targetNode, bulkRender){
        this.indentMarkup = n.parentNode ? n.parentNode.ui.getChildIndent() : '';

        var t = n.getOwnerTree();
        var cols = t.columns;
        var bw = t.borderWidth;
        var c = cols[0];

        var buf = [
             '<li class="x-tree-node"><div ext:tree-node-id="',n.id,'" class="x-tree-node-el x-tree-node-leaf ', a.cls,'">',
                '<div class="x-tree-col" style="width:',c.width-bw,'px;">',
                    '<span class="x-tree-node-indent">',this.indentMarkup,"</span>",
                    '<img src="', this.emptyIcon, '" class="x-tree-ec-icon x-tree-elbow">',
                    '<img src="', a.icon || this.emptyIcon, '" class="',(a.icon ? " x-tree-node-inline-icon" : ""),(a.iconCls ? " "+a.iconCls : "x-tree-node-icon"),'" unselectable="on">',
                    '<a hidefocus="on" class="x-tree-node-anchor" href="',a.href ? a.href : "#",'" tabIndex="1" ',
                    a.hrefTarget ? ' target="'+a.hrefTarget+'"' : "", '>',
                    '<span unselectable="on">', n.text || (c.renderer ? c.renderer(a[c.dataIndex], n, a) : a[c.dataIndex]),"</span></a>",
                "</div>"];
         for(var i = 1, len = cols.length; i < len; i++){
             c = cols[i];

             buf.push('<div class="x-tree-col ',(c.cls?c.cls:''),'" style="width:',c.width-bw,'px;">',
                        '<div class="x-tree-col-text">',(c.renderer ? c.renderer(a[c.dataIndex], n, a) : a[c.dataIndex]),"</div>",
                      "</div>");
         }
         buf.push(
            '<div class="x-clear"></div></div>',
            '<ul class="x-tree-node-ct" style="display:none;"></ul>',
            "</li>");

        if(bulkRender !== true && n.nextSibling && n.nextSibling.ui.getEl()){
            this.wrap = Ext.DomHelper.insertHtml("beforeBegin",
                                n.nextSibling.ui.getEl(), buf.join(""));
        }else{
            this.wrap = Ext.DomHelper.insertHtml("beforeEnd", targetNode, buf.join(""));
        }

        this.elNode = this.wrap.childNodes[0];
        this.ctNode = this.wrap.childNodes[1];
        var cs = this.elNode.firstChild.childNodes;
        this.indentNode = cs[0];
        this.ecNode = cs[1];
        this.iconNode = cs[2];

        this.anchor = cs[3];
        this.textNode = cs[3].firstChild;
    },
  /**
	 * Refreshes the node's HTML element.
   */
    refresh: function() {
        var n = this.node;
        if (!n.rendered) {
            return;
        }
        var t = n.getOwnerTree();
        var a = n.attributes;
        var cols = t.columns;
        var el = n.ui.getEl().firstChild;
        var cells = el.childNodes;
        for (var i = 1, len = cols.length; i < len; i++) {
            var d = cols[i].dataIndex;
            var v = (a[d] != null) ? a[d] : '';
            if (cols[i].renderer) {
                v = cols[i].renderer(v, n);
            }
            cells[i].firstChild.innerHTML = v;
        }
    },
	/**
	 * Sets the node's CSS icon class.
	 * @param {String} className The name of the CSS class.
	 */
    setIconElClass: function(className) {
			var n = this.node;
			if (!n.rendered) {
				n.attributes.iconCls = className;
				return;
			}
			var iconEl = this.getIconEl();
			iconEl.className = className;
    }
});
