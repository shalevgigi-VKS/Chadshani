/**
 * Schematic Evolution — MindMap Renderer v1.0
 * D3.js v7, RTL Hebrew, top-to-bottom tree with arrows and glow
 */
class MindMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.collapsed = new Set();
    this.currentData = null;
    this.tooltip = document.getElementById('tooltip');
    this.NODE_W = 210; this.NODE_H = 54;
    this.GAP_X = 30;   this.GAP_Y = 90;
    this.ANIM = 400;
    this._initSVG();
    window.addEventListener('resize', () => { if(this.currentData){ this._initSVG(); this.render(this.currentData); }});
  }

  _initSVG() {
    d3.select(this.container).selectAll('*').remove();
    this.w = this.container.clientWidth || window.innerWidth - 260;
    this.h = this.container.clientHeight || window.innerHeight - 70;
    this.svg = d3.select(this.container).append('svg').attr('width','100%').attr('height','100%').style('overflow','hidden');
    this._addDefs();
    this.zoomG = this.svg.append('g');
    this.linksG = this.zoomG.append('g');
    this.nodesG = this.zoomG.append('g');
    this.zoom = d3.zoom().scaleExtent([0.05,4]).on('zoom', e => this.zoomG.attr('transform', e.transform));
    this.svg.call(this.zoom).on('dblclick.zoom', null);
  }

  _addDefs() {
    const defs = this.svg.append('defs');
    defs.append('pattern').attr('id','dotgrid').attr('width',32).attr('height',32)
      .attr('patternUnits','userSpaceOnUse').append('circle')
      .attr('cx',1).attr('cy',1).attr('r',0.8).attr('fill','#1E293B');
    this.svg.insert('rect',':first-child').attr('width','100%').attr('height','100%').attr('fill','url(#dotgrid)');
    Object.entries(COLORS.categories).forEach(([key]) => {
      const f = defs.append('filter').attr('id',`glow-${key}`).attr('x','-40%').attr('y','-40%').attr('width','180%').attr('height','180%');
      f.append('feGaussianBlur').attr('stdDeviation','5').attr('in','SourceGraphic').attr('result','blur');
      const m = f.append('feMerge'); m.append('feMergeNode').attr('in','blur'); m.append('feMergeNode').attr('in','SourceGraphic');
      defs.append('marker').attr('id',`arrow-${key}`).attr('viewBox','0 -5 10 10')
        .attr('refX',8).attr('refY',0).attr('markerWidth',5).attr('markerHeight',5).attr('orient','auto')
        .append('path').attr('d','M0,-4L10,0L0,4').attr('fill', COLORS.getCategory(key).border).attr('fill-opacity',0.65);
    });
  }

  render(data) {
    this.currentData = data;
    if (!data) return;
    const root = this._hierarchy(data);
    const layout = this._layout(root);
    this._drawLinks(layout);
    this._drawNodes(layout);
    this._center(layout);
  }

  _hierarchy(data) {
    return d3.hierarchy(data, d => this.collapsed.has(d.id) ? null : (d.children?.length ? d.children : null));
  }

  _layout(root) {
    d3.tree().nodeSize([this.NODE_W + this.GAP_X, this.NODE_H + this.GAP_Y])(root);
    root.each(n => { n.x = -n.x; }); // RTL flip
    return root;
  }

  _drawLinks(root) {
    this.linksG.selectAll('.edge').data(root.links(), d => `${d.source.data.id}-${d.target.data.id}`)
      .join(
        e => e.append('path').attr('class','edge').attr('opacity',0).call(s=>s.transition().duration(this.ANIM).attr('opacity',1)),
        u => u.call(s=>s.transition().duration(this.ANIM)),
        x => x.call(s=>s.transition().duration(200).attr('opacity',0).remove())
      )
      .attr('d', d => {
        const sx=d.source.x, sy=d.source.y+this.NODE_H/2, tx=d.target.x, ty=d.target.y-this.NODE_H/2-6;
        const my=(sy+ty)/2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      })
      .attr('fill','none')
      .attr('stroke', d => COLORS.getCategory(d.target.data.category).border)
      .attr('stroke-width', d => d.target.depth===1?2:1.2)
      .attr('stroke-opacity', d => d.target.depth===1?0.65:0.4)
      .attr('stroke-dasharray', d => d.target.depth>2?'5,4':'none')
      .attr('marker-end', d => `url(#arrow-${d.target.data.category})`);
  }

  _drawNodes(root) {
    const self = this;
    this.nodesG.selectAll('.node').data(root.descendants(), d=>d.data.id)
      .join(
        e => {
          const g = e.append('g').attr('class','node').attr('opacity',0)
            .attr('transform', d=>`translate(${d.x-self.NODE_W/2},${d.y-self.NODE_H/2})`)
            .style('cursor', d=>d.data.children?.length?'pointer':'default');
          self._buildNode(g);
          g.on('click',(e,d)=>self._toggle(d))
           .on('mouseenter',(e,d)=>self._tip(e,d))
           .on('mouseleave',()=>self._untip());
          g.transition().duration(self.ANIM).attr('opacity',1);
          return g;
        },
        u => u.call(s=>s.transition().duration(self.ANIM).attr('transform',d=>`translate(${d.x-self.NODE_W/2},${d.y-self.NODE_H/2})`).attr('opacity',1)),
        x => x.call(s=>s.transition().duration(200).attr('opacity',0).remove())
      );
  }

  _buildNode(sel) {
    const W=this.NODE_W, H=this.NODE_H, self=this;
    sel.each(function(d) {
      const g=d3.select(this);
      const cat=COLORS.getCategory(d.data.category);
      const isRoot=d.depth===0, isCat=d.depth===1;
      const hasKids=d.data.children?.length>0;
      const collapsed=self.collapsed.has(d.data.id);
      const rx=isRoot?12:8;
      // Shadow
      g.append('rect').attr('width',W).attr('height',H).attr('rx',rx).attr('fill','#000').attr('opacity',0.35).attr('transform','translate(3,4)');
      // BG
      g.append('rect').attr('width',W).attr('height',H).attr('rx',rx).attr('fill',cat.bg)
        .attr('stroke',cat.border).attr('stroke-width',isRoot?2.5:isCat?2:1.2)
        .attr('filter',(isRoot||isCat)?`url(#glow-${d.data.category})`:null);
      // Right accent bar
      g.append('rect').attr('x',W-5).attr('y',rx/2).attr('width',4).attr('height',H-rx).attr('rx',2).attr('fill',cat.border).attr('opacity',isCat||isRoot?1:0.5);
      // Icon (root + category)
      if(isRoot||isCat){
        g.append('circle').attr('cx',28).attr('cy',H/2).attr('r',14).attr('fill',cat.border).attr('opacity',0.15);
        g.append('text').attr('x',28).attr('y',H/2+5).attr('text-anchor','middle').attr('fill',cat.border).attr('font-size',13).text(cat.icon||'◆');
      }
      // Name
      const ny=isRoot?H/2+2:isCat?H/2-(d.data.count?7:2):H/2+5;
      g.append('text').attr('x',W-16).attr('y',ny).attr('text-anchor','end')
        .attr('fill',cat.text).attr('font-size',isRoot?16:isCat?14:12).attr('font-weight',isRoot?700:isCat?600:400)
        .attr('font-family','Heebo,sans-serif').text(d.data.nameHe||d.data.name);
      // Description line
      if(isCat&&d.data.description){
        g.append('text').attr('x',W-16).attr('y',ny+15).attr('text-anchor','end')
          .attr('fill',cat.text).attr('font-size',10).attr('opacity',0.55).attr('font-family','Heebo,sans-serif')
          .text((d.data.description).substring(0,28));
      }
      // Count badge
      if(d.data.count&&isCat){
        g.append('rect').attr('x',46).attr('y',H/2-9).attr('width',34).attr('height',18).attr('rx',9).attr('fill',cat.border).attr('opacity',0.2);
        g.append('text').attr('x',63).attr('y',H/2+5).attr('text-anchor','middle').attr('fill',cat.border)
          .attr('font-size',11).attr('font-weight',700).attr('font-family','Heebo,sans-serif').text(`×${d.data.count}`);
      }
      // Expand arrow
      if(hasKids){
        g.append('text').attr('x',14).attr('y',H/2+5).attr('text-anchor','middle')
          .attr('fill',cat.border).attr('font-size',10).attr('opacity',0.8).text(collapsed?'▶':'▾');
      }
    });
  }

  _toggle(d) {
    if(!d.data.children?.length) return;
    this.collapsed.has(d.data.id)?this.collapsed.delete(d.data.id):this.collapsed.add(d.data.id);
    this.linksG.selectAll('*').remove(); this.nodesG.selectAll('*').remove();
    const r=this._hierarchy(this.currentData), l=this._layout(r);
    this._drawLinks(l); this._drawNodes(l);
  }

  _tip(e, d) {
    if(!this.tooltip) return;
    const cat=COLORS.getCategory(d.data.category);
    const desc=d.data.description||d.data.purpose||'';
    this.tooltip.innerHTML=`<div style="color:${cat.border};font-weight:700;margin-bottom:4px">${d.data.nameHe||d.data.name}</div><div style="color:#94A3B8;font-size:12px">${desc.substring(0,120)}</div>${d.data.count?`<div style="color:${cat.border};font-size:11px;margin-top:4px">×${d.data.count} פריטים</div>`:''}${d.data.status?`<div style="font-size:10px;opacity:0.6;margin-top:3px">${d.data.status}</div>`:''}`;
    this.tooltip.style.display='block';
    const tw=220, left=e.clientX+14>window.innerWidth-tw-10?e.clientX-tw-14:e.clientX+14;
    const top=e.clientY+100>window.innerHeight?e.clientY-100:e.clientY-10;
    this.tooltip.style.left=left+'px'; this.tooltip.style.top=top+'px';
  }

  _untip() { if(this.tooltip) this.tooltip.style.display='none'; }

  _center(root) {
    let minX=Infinity,maxX=-Infinity;
    root.each(n=>{ minX=Math.min(minX,n.x-this.NODE_W/2); maxX=Math.max(maxX,n.x+this.NODE_W/2); });
    const cx=(minX+maxX)/2, scale=Math.min(1,(this.w-80)/(maxX-minX));
    this.svg.transition().duration(500).call(this.zoom.transform, d3.zoomIdentity.translate(this.w/2-cx*scale,60).scale(scale));
  }

  resetView() { if(this.currentData){ const r=this._hierarchy(this.currentData); this._center(this._layout(r)); } }
  expandAll() { this.collapsed.clear(); this._rebuild(); }
  collapseAll() { this.currentData?.children?.forEach(c=>c.id&&this.collapsed.add(c.id)); this._rebuild(); }
  _rebuild() { this.linksG.selectAll('*').remove(); this.nodesG.selectAll('*').remove(); const r=this._hierarchy(this.currentData),l=this._layout(r); this._drawLinks(l); this._drawNodes(l); }
}
