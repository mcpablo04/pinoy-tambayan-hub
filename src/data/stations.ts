// src/data/stations.ts
import { Station } from "../context/PlayerContext";

/** * Extend Station with optional metadata for directory pages.
 * Station (from PlayerContext) provides: id, name, streamUrl, and logo.
 */
export type StationEx = Station & {
  description?: string;
  genre?: string;
  city?: string;
  country?: string;
  website?: string;
  officialEmbedUrl?: string; // if a station provides its own embeddable player
};

export const STATIONS: StationEx[] = [
  {
    id: "love-radio",
    name: "90.7 Love Radio Manila",
    streamUrl: "https://azura.loveradio.com.ph/listen/love_radio_manila/radio.mp3",
    logo: "https://static.mytuner.mobi/media/tvos_radios/141/dzmb-love-radio-907-fm.fd6dd832.png",
    genre: "Pop / OPM",
    city: "Manila",
    country: "Philippines",
    website: "https://www.loveradio.com.ph/",
    description: "A top FM station in Metro Manila playing OPM, pop hits, and feel-good tracks.",
  },
  {
    id: "easy-rock",
    name: "96.3 Easy Rock Manila",
    streamUrl: "https://azura.easyrock.com.ph/listen/easy_rock_manila/radio.mp3",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/138/dwrk-963-easy-rock.c2c03660.png",
    genre: "Soft Rock / Adult Contemporary",
    city: "Makati",
    country: "Philippines",
    website: "https://www.easyrock.com.ph/",
    description: "Laid‑back classics and love songs—soft rock and adult contemporary all day.",
  },
  {
    id: "energy-fm",
    name: "106.7 Energy FM Manila",
    streamUrl: "http://ph-icecast.eradioportal.com:8000/energyfm_manila",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/PG5RgCjKLe.png",
    genre: "Top 40 / Variety",
    city: "Mandaluyong",
    country: "Philippines",
    website: "https://www.energyfm1067.com/",
    description: "High‑energy Top 40, OPM, and variety programming with fun on‑air personalities.",
  },
  {
    id: "win-radio",
    name: "91.5 Win Radio Manila",
    streamUrl: "https://stream-172.zeno.fm/2ss1hgnu6hhvv",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/x4zvpbxrnhkk.jpg",
    genre: "OPM / Pop",
    city: "Pasig",
    country: "Philippines",
    website: "https://www.winradio.com.ph/",
    description: "OPM and pop favorites plus masa‑friendly shows for the daily commute.",
  },
  {
    id: "barangay-ls",
    name: "97.1 Barangay LS Manila",
    streamUrl: "https://magic.radioca.st/stream", 
    logo: "https://static2.mytuner.mobi/media/tvos_radios/672/dwls-barangay-ls-971-fm.75899014.jpg",
    genre: "Masa / OPM",
    city: "Quezon City",
    country: "Philippines",
    website: "https://www.gmanetwork.com/radio/dwls/",
    description: "Masa hits, OPM, and lively banter—#TugstuganNa with Barangay LS 97.1.",
  },
  {
    id: "home-radio",
    name: "97.9 Home Radio",
    streamUrl: "https://hrmanila.radioca.st/stream",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/3fFrky9eJE.jpg",
    genre: "Easy Listening / Variety",
    city: "Quezon City",
    country: "Philippines",
    website: "https://homeradiomanila.com/",
    description: "Easy listening and variety programming—companion radio for work and study.",
  },
  {
    id: "star-fm",
    name: "102.7 Star FM Manila",
    streamUrl: "https://stream-24.zeno.fm/536cwdq78heuv?zs=QvLMk8MiRVyUrdV4IHH_Dg",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/848/star-fm-manila.c6a245b5.png",
    genre: "Top 40 / OPM",
    city: "Manila",
    country: "Philippines",
    website: "https://www.bomboradyo.com/starfm/",
    description: "Top 40, OPM, and news updates—Star FM blends music and info for the city.",
  },
  {
    id: "mor-entertainment",
    name: "MOR entertainment",
    streamUrl: "https://stream-152.zeno.fm/0ha8ftewqp8uv",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/ngt3qgajtbv4.png",
    genre: "OPM / Pop",
    city: "Metro Manila (online)",
    country: "Philippines",
    website: "https://www.mor1019.com/",
    description: "MOR’s online programming with OPM/pop and fan‑favorite DJs and segments.",
  },
  {
    id: "yes!",
    name: "106.3 Yes! The Best Dagupan",
    streamUrl: "https://yesfmdagupan.radioca.st/;",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/BqJVd2R4x8.jpg",
    genre: "OPM / Pop",
    city: "Dagupan",
    country: "Philippines",
    website: "https://www.yesthebest.com.ph/",
    description: "Regional masa hits and OPM bangers—Yes! The Best Dagupan’s online stream.",
  },
  {
    id: "dzrh",
    name: "666 AM DZRH",
    streamUrl: "https://a4.asurahosting.com:6540/radio.mp3",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/614/dzrh-666-am.b57c7abf.png",
    genre: "News / Talk",
    city: "Pasay",
    country: "Philippines",
    website: "https://dzrh.com.ph/",
    description: "Philippines’ pioneering news and public affairs radio—headlines and commentary.",
  },
  {
    id: "dzmm",
    name: "630 AM DZMM",
    streamUrl: "http://us1.amfmph.com:8852/stream",
    logo: "https://static2.mytuner.mobi/media/tvos_radios/142/dwpm-radyo-630.4b154568.jpg",
    genre: "News / Public Service",
    city: "Quezon City",
    country: "Philippines",
    website: "https://news.abs-cbn.com/",
    description: "News and public service programming with nationwide coverage and updates.",
  },
];