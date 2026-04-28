const localMapSymbolSrc = (symbol: string) => `${import.meta.env.BASE_URL}map-symbols-commons/${symbol}.svg`;

export type MapSymbolAsset = {
  src: string;
  sourcePage: string;
  title: string;
  license: 'Public domain';
};

export const MAP_SYMBOL_ASSET_MAP: Record<string, MapSymbolAsset> = {
  city_office: {
        src: localMapSymbolSrc('city_office'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(City_Hall).svg',
    title: 'Japanese Map symbol (City Hall)',
    license: 'Public domain',
  },
  town_office: {
        src: localMapSymbolSrc('town_office'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Town_or_Village_Office).svg',
    title: 'Japanese Map symbol (Town or Village Office)',
    license: 'Public domain',
  },
  school: {
        src: localMapSymbolSrc('school'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Elementary_or_Junior_high_school).svg',
    title: 'Japanese Map symbol (Elementary or Junior high school)',
    license: 'Public domain',
  },
  post_office: {
        src: localMapSymbolSrc('post_office'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Post_office).svg',
    title: 'Japanese Map symbol (Post office)',
    license: 'Public domain',
  },
  post_office_round: {
        src: localMapSymbolSrc('post_office_round'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Post_office).svg',
    title: 'Japanese Map symbol (Post office)',
    license: 'Public domain',
  },
  temple: {
        src: localMapSymbolSrc('temple'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Temple).svg',
    title: 'Japanese Map symbol (Temple)',
    license: 'Public domain',
  },
  shrine: {
        src: localMapSymbolSrc('shrine'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Shrine).svg',
    title: 'Japanese Map symbol (Shrine)',
    license: 'Public domain',
  },
  police_box: {
        src: localMapSymbolSrc('police_box'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Koban).svg',
    title: 'Japanese Map symbol (Koban)',
    license: 'Public domain',
  },
  police_station: {
        src: localMapSymbolSrc('police_station'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Police_station).svg',
    title: 'Japanese Map symbol (Police station)',
    license: 'Public domain',
  },
  fire_station: {
        src: localMapSymbolSrc('fire_station'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Fire_station).svg',
    title: 'Japanese Map symbol (Fire station)',
    license: 'Public domain',
  },
  factory: {
        src: localMapSymbolSrc('factory'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Factory).svg',
    title: 'Japanese Map symbol (Factory)',
    license: 'Public domain',
  },
  health_center: {
        src: localMapSymbolSrc('health_center'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Health_center).svg',
    title: 'Japanese Map symbol (Health center)',
    license: 'Public domain',
  },
  hospital: {
        src: localMapSymbolSrc('hospital'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Hospital).svg',
    title: 'Japanese Map symbol (Hospital)',
    license: 'Public domain',
  },
  rice_field: {
        src: localMapSymbolSrc('rice_field'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Rice_field).svg',
    title: 'Japanese Map symbol (Rice field)',
    license: 'Public domain',
  },
  farm: {
        src: localMapSymbolSrc('farm'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Field).svg',
    title: 'Japanese Map symbol (Field)',
    license: 'Public domain',
  },
  orchard: {
        src: localMapSymbolSrc('orchard'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Orchard).svg',
    title: 'Japanese Map symbol (Orchard)',
    license: 'Public domain',
  },
  tea_field: {
        src: localMapSymbolSrc('tea_field'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Tea_plantation).svg',
    title: 'Japanese Map symbol (Tea plantation)',
    license: 'Public domain',
  },
  broadleaf_forest: {
        src: localMapSymbolSrc('broadleaf_forest'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Broadleaf_trees).svg',
    title: 'Japanese Map symbol (Broadleaf trees)',
    license: 'Public domain',
  },
  conifer_forest: {
        src: localMapSymbolSrc('conifer_forest'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Coniferous_trees).svg',
    title: 'Japanese Map symbol (Coniferous trees)',
    license: 'Public domain',
  },
  cemetery: {
        src: localMapSymbolSrc('cemetery'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Graveyard).svg',
    title: 'Japanese Map symbol (Graveyard)',
    license: 'Public domain',
  },
  castle_ruins: {
        src: localMapSymbolSrc('castle_ruins'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Castle).svg',
    title: 'Japanese Map symbol (Castle)',
    license: 'Public domain',
  },
  self_defense_force: {
        src: localMapSymbolSrc('self_defense_force'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(the_Self-Defense_Forces).svg',
    title: 'Japanese Map symbol (the Self-Defense Forces)',
    license: 'Public domain',
  },
  lighthouse: {
        src: localMapSymbolSrc('lighthouse'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Lighthouse).svg',
    title: 'Japanese Map symbol (Lighthouse)',
    license: 'Public domain',
  },
  court: {
        src: localMapSymbolSrc('court'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Court_of_law).svg',
    title: 'Japanese Map symbol (Court of law)',
    license: 'Public domain',
  },
  wasteland: {
        src: localMapSymbolSrc('wasteland'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Barren_land).svg',
    title: 'Japanese Map symbol (Barren land)',
    license: 'Public domain',
  },
  government_office: {
        src: localMapSymbolSrc('government_office'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Government_or_Municipal_office).svg',
    title: 'Japanese Map symbol (Government or Municipal office)',
    license: 'Public domain',
  },
  power_station: {
        src: localMapSymbolSrc('power_station'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Power_plant).svg',
    title: 'Japanese Map symbol (Power plant)',
    license: 'Public domain',
  },
  weather_station: {
        src: localMapSymbolSrc('weather_station'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Meteorological_observatory).svg',
    title: 'Japanese Map symbol (Meteorological observatory)',
    license: 'Public domain',
  },
  museum: {
        src: localMapSymbolSrc('museum'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Museum).svg',
    title: 'Japanese Map symbol (Museum)',
    license: 'Public domain',
  },
  library: {
        src: localMapSymbolSrc('library'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Library).svg',
    title: 'Japanese Map symbol (Library)',
    license: 'Public domain',
  },
  monument: {
        src: localMapSymbolSrc('monument'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Monument).svg',
    title: 'Japanese Map symbol (Monument)',
    license: 'Public domain',
  },
  electronic_control_point: {
        src: localMapSymbolSrc('electronic_control_point'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Electronic_Datum_point).svg',
    title: 'Japanese Map symbol (Electronic Datum point)',
    license: 'Public domain',
  },
  triangulation_point: {
        src: localMapSymbolSrc('triangulation_point'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Triangulation_point).svg',
    title: 'Japanese Map symbol (Triangulation point)',
    license: 'Public domain',
  },
  benchmark: {
        src: localMapSymbolSrc('benchmark'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Standard_point).svg',
    title: 'Japanese Map symbol (Standard point)',
    license: 'Public domain',
  },
  mulberry_field: {
        src: localMapSymbolSrc('mulberry_field'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Mulberry_field).svg',
    title: 'Japanese Map symbol (Mulberry field)',
    license: 'Public domain',
  },
  bamboo_grove: {
        src: localMapSymbolSrc('bamboo_grove'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Bamboo_grove).svg',
    title: 'Japanese Map symbol (Bamboo grove)',
    license: 'Public domain',
  },
  smokestack: {
        src: localMapSymbolSrc('smokestack'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Chimney).svg',
    title: 'Japanese Map symbol (Chimney)',
    license: 'Public domain',
  },
  crater: {
        src: localMapSymbolSrc('crater'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Crater_or_Fumarole).svg',
    title: 'Japanese Map symbol (Crater or Fumarole)',
    license: 'Public domain',
  },
  quarry: {
        src: localMapSymbolSrc('quarry'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Quarry).svg',
    title: 'Japanese Map symbol (Quarry)',
    license: 'Public domain',
  },
  oil_gas_well: {
        src: localMapSymbolSrc('oil_gas_well'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Oil_or_Gas_well).svg',
    title: 'Japanese Map symbol (Oil or Gas well)',
    license: 'Public domain',
  },
  historic_site: {
        src: localMapSymbolSrc('historic_site'),
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Japanese_Map_symbol_(Historical_site-Place_of_scenic_beauty-Natural_monument-Protected_animal_plant).svg',
    title: 'Japanese Map symbol (Historical site-Place of scenic beauty-Natural monument-Protected animal plant)',
    license: 'Public domain',
  },
};

export const MAP_SYMBOL_IMAGE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MAP_SYMBOL_ASSET_MAP).map(([symbol, asset]) => [symbol, asset.src]),
);

export const MAP_SYMBOL_SOURCE_LABEL = '出典: Wikimedia Commons（Public domain）';

