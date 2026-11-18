/* ===== Personavel – map gestures =====
   - mouse drag / one-finger drag: move the map (Leaflet)
   - mouse wheel, touchpad vertical scroll, pinch, + / - buttons: zoom (Leaflet, reliable in every browser)
   - touchpad sideways swipe: move the map left / right */
(function(){
'use strict';
function setup(mp){
  if (mp._pvGest) return; mp._pvGest = true;
  try { mp.dragging.enable(); mp.touchZoom.enable(); mp.keyboard.enable(); mp.scrollWheelZoom.enable(); mp.doubleClickZoom.enable(); } catch(e){}
  mp.options.wheelPxPerZoomLevel = 130; mp.options.wheelDebounceTime = 30;
  const el = mp.getContainer(); el.classList.add('pv-pan');
  el.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;                                        // pinch → Leaflet zooms
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2 && Math.abs(e.deltaX) > 1){
      e.preventDefault(); e.stopPropagation();
      mp.panBy([e.deltaX, 0], {animate:false});
    }
  }, {passive:false, capture:true});
}
const prev = PV.baseLayer;
PV.baseLayer = (mp) => { try { setup(mp); } catch(e){} return prev(mp); };
})();
