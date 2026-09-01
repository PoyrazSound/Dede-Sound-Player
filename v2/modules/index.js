const make=(id,name,description)=>({id,name,description,test(log){log.textContent=`MODÜL ${id}: ${name}\nTest kanalı hazır. MIDI + bağımsız ses motoru sonraki aşamada bağlanacak.`;}});
export const modules=[
make(1,'Core / Audio Engine','Web Audio ana motoru'),
make(2,'Sample Manager','HDD/disk sample erişimi ve önbellek'),
make(3,'Voice Engine','Poly/mono voice yönetimi'),
make(4,'Legato + Portamento/Glide','Legato ve gerçek pitch glide'),
make(5,'Mapping Engine','Key/velocity mapping'),
make(6,'Velocity Layer','Velocity katman seçimi'),
make(7,'MIDI Engine','MIDI input / note / CC'),
make(8,'61 Key Keyboard','61 tuş sanal klavye'),
make(9,'Pitch Bend + Modulation','Bend ve modülasyon'),
make(10,'Envelope / Volume / Pan / Tune','Temel performans parametreleri'),
make(11,'Micro Tuning','-100/+100 cent mikro akort'),
make(12,'FX Studio','DSP efekt zinciri'),
make(13,'Loop Studio','Loop ve pitch-independent tempo'),
make(14,'Program / Preset Save','Program/proje kayıt sistemi'),
make(15,'Sample Library / Index','Sample tarama ve indeks'),
make(16,'UI Panelleri','Bağımsız arayüz panelleri'),
make(17,'Settings / State Manager','Ayar ve uygulama durumu'),
make(18,'Integration / Master Bus','Tüm modüllerin final birleşim katmanı')
];
