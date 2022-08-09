export const VERTICLE_LINE_CHART_PLUGIN = {
  afterDraw: chart => {
    if (chart.tooltip?._active?.length) {
      let x = chart.tooltip._active[0].element.x;
      let yAxis = chart.scales.y;
      let ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, yAxis.top);
      ctx.lineTo(x, yAxis.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'hsl(0, 100%, 50%)';
      ctx.stroke();
      ctx.restore();
    }
  },
};
