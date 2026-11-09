/* Color preferences travel with the regular encrypted backup. */
(()=>{
'use strict';
const fields=[
 ['accent','Destaque'],['secondary','Cor secundária'],['background','Fundo do aplicativo'],
 ['surface','Cartões e formulários'],['navigation','Menus e barra inferior'],['border','Bordas'],
 ['chartPrimary','Primeira linha dos gráficos'],['chartSecondary','Segunda linha dos gráficos']
];
const defaults={accent:'#b9507f',secondary:'#8c75c5',background:'#fcfafd',surface:'#ffffff',navigation:'#ffffff',border:'#e9e2e9',chartPrimary:'#c77aa5',chartSecondary:'#8c75c5'};
const hex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
const rgb=color=>color.slice(1).match(/../g).map(value=>parseInt(value,16));
function mix(a,b,weight){
 const other=rgb(b);
 return '#'+rgb(a).map((value,index)=>Math.round(value*(1-weight)+other[index]*weight).toString(16).padStart(2,'0')).join('');
}
function luminance(color){
 return rgb(color).map(value=>{value/=255;return value<=.04045?value/12.92:((value+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function textOn(background,preferred='#41384a'){
 if(contrast(background,preferred)>=4.5)return preferred;
 return contrast(background,'#ffffff')>contrast(background,'#17131b')?'#ffffff':'#17131b';
}
const palettes=[
 ['original','Silhuetta original',defaults],
 ...[
  ['teal','Turquesa','#067f79','#2563eb'],['blue','Azul vivo','#205bd7','#7c3aed'],
  ['purple','Violeta','#7532d5','#c026d3'],['wine','Rosa','#c52c78','#8b3fd3'],
  ['green','Verde','#15803d','#0d9488'],['ochre','Dourado','#99700a','#b45309'],
  ['coral','Coral','#cd3653','#e15528'],['cyan','Ciano','#087d99','#2563eb'],
  ['indigo','Índigo','#4f46e5','#9333ea'],['fuchsia','Fúcsia','#ad26bb','#db2777'],
  ['orange','Laranja','#b94d08','#c0265b'],['lime','Lima','#4d7c0f','#16875a'],
  ['slate','Grafite','#475569','#0f766e']
 ].map(([id,label,accent,secondary])=>[id,label,{...defaults,accent,secondary,background:mix(accent,'#ffffff',.97),border:mix(accent,'#ffffff',.83),chartPrimary:accent,chartSecondary:secondary}])
];
function clean(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const colors=Object.fromEntries(fields.map(([key])=>[key,hex(value[key])?value[key].toLowerCase():defaults[key]]));
 return fields.every(([key])=>colors[key]===defaults[key])?null:colors;
}
function selected(value){
 if(!value)return 'original';
 const colors=clean(value)||defaults;
 return palettes.find(([, ,palette])=>fields.every(([key])=>colors[key]===palette[key]))?.[0]||'custom';
}
function palette(id){return id==='original'?null:palettes.find(([key])=>key===id)?.[2];}
const cssVariables=['ink','page-ink','nav-ink','muted','page-muted','nav-muted','accent-ink','accent-page','on-accent','soft','nav-soft','secondary-ink','secondary-soft','on-soft','on-secondary-soft','on-nav-soft','control-scheme'];
function apply(value){
 const root=document.documentElement,colors=clean(value);
 root.toggleAttribute('data-custom-colors',!!colors);
 if(!colors){
  for(const key of [...fields.map(([key])=>key),...cssVariables])root.style.removeProperty('--theme-'+key);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content','#FCFAFD');
  return;
 }
 const derived={
  ink:textOn(colors.surface),'page-ink':textOn(colors.background),'nav-ink':textOn(colors.navigation),
  'on-accent':textOn(colors.accent),'accent-ink':textOn(colors.surface,colors.accent),
  'accent-page':textOn(colors.background,colors.accent),
  'secondary-ink':textOn(colors.surface,colors.secondary),'secondary-soft':mix(colors.secondary,colors.surface,.9),
  soft:mix(colors.accent,colors.surface,.9),'nav-soft':mix(colors.accent,colors.navigation,.88)
 };
 derived['on-soft']=textOn(derived.soft,colors.accent);
 derived['on-secondary-soft']=textOn(derived['secondary-soft'],colors.secondary);
 derived['on-nav-soft']=textOn(derived['nav-soft'],colors.accent);
 derived['control-scheme']=luminance(colors.surface)<.2?'dark':'light';
 derived.muted=textOn(colors.surface,mix(derived.ink,colors.surface,.2));
 derived['page-muted']=textOn(colors.background,mix(derived['page-ink'],colors.background,.2));
 derived['nav-muted']=textOn(colors.navigation,mix(derived['nav-ink'],colors.navigation,.2));
 for(const [key,color] of Object.entries({...colors,...derived}))root.style.setProperty('--theme-'+key,color);
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',colors.background);
}
function section(value){
 const colors=clean(value)||defaults,preset=selected(value);
 const options=palettes.map(([id,label])=>'<option value="'+id+'" '+(preset===id?'selected':'')+'>'+label+'</option>').join('');
 const controls=fields.map(([key,label])=>
  '<div class="appearance-field"><label for="appearance-'+key+'">'+label+'</label><div class="appearance-inputs">'+
  '<input type="color" id="appearance-'+key+'" value="'+colors[key]+'" data-appearance-field="'+key+'">'+
  '<input type="text" id="appearance-hex-'+key+'" value="'+colors[key]+'" data-appearance-field="'+key+'" aria-label="Código hexadecimal — '+label+'" maxlength="7" spellcheck="false" autocapitalize="off" pattern="#[0-9a-fA-F]{6}"></div></div>'
 ).join('');
 return '<section class="card settings-section appearance-settings" aria-labelledby="appearanceHeading"><h2 id="appearanceHeading">Cores do aplicativo</h2>'+
  '<p>Escolha uma paleta ou ajuste cada cor. As mudanças aparecem na hora e fazem parte do seu backup na nuvem.</p>'+
  '<div class="field"><label for="appearancePreset">Paleta</label><select id="appearancePreset">'+options+'<option value="custom" '+(preset==='custom'?'selected':'')+'>Personalizada</option></select></div>'+
  '<details class="help-extra appearance-details"><summary>Ajustar cada cor</summary><div class="appearance-grid">'+controls+'</div>'+
  '<p class="fine-print">Use o seletor ou um código como #205bd7. O texto se ajusta automaticamente para manter a leitura.</p></details>'+
  '<div class="settings-summary"><button type="button" class="btn btn-plain" data-action="resetAppearance">Restaurar cores originais</button>'+
  '<span id="appearanceStatus" class="small-muted" role="status">Salvamento automático neste aparelho. Sincroniza com a nuvem conectada.</span></div></section>';
}
function updateControls(value,changedField=null){
 const colors=clean(value)||defaults,preset=document.getElementById('appearancePreset');
 if(preset)preset.value=selected(value);
 for(const [key] of fields.filter(([key])=>!changedField||key===changedField))for(const input of document.querySelectorAll('[data-appearance-field="'+key+'"]')){input.value=colors[key];input.removeAttribute('aria-invalid');}
}
window.SilhuettaAppearance={defaults,fields,hex,clean,apply,section,palette,updateControls};
})();
