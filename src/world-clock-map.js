/* ==========================================================================
   SHARVIN MHATRE PORTFOLIO — CONTINENTAL PIXEL DOT MAP & 24HR WATER CLOCK
   Precise pixel-by-pixel continent dots from vector coastline geometries,
   10-12 timezones per continent (66 global hubs), real-time solar terminator,
   and fluid 24HR HH:MM:SS clock with aquatic water ripple refraction typography.
   Engineered for 240Hz butter-smooth GPU rendering.
   ========================================================================== */

(function () {
  'use strict';

  // Base64-packed 16-bit binary buffer of 2,426 land dots across 6 continents
  // Format per uint16: (row: 6 bits) << 10 | (col: 7 bits) << 3 | (cont: 3 bits)
  const PACKED_DOTS_B64 = "8AD4AAABCAEQARgBIAEoATABQAFIAVABWAFgAWgBcAF4AYABiAGQAZgBoAGsAbQBugHCAcoBKgIyAjoCQgJKAgwDFAPABPAEEAUYBTgFQAVIBVAFWAVgBWgFcAV4BYAFiAWQBZgFoAWsBbQFugXCBSoGOgZCBrgIwAjICNAI4AjwCPgIAAkQCRgJWAlgCWgJcAl4CYAJiAmQCZgJoAmsCbQJugnCCaQKrAoECwwLFAscCyQLLAs0CzwLhAuMC5QLoAyoDLAM0AzgDOgM8Az4DAgNEA0YDSANYA1oDXANeA2ADYgNkA2YDaANrA20DboNnA7kDuwO9A78DgQPDA8UDxwPJA8sDzQPPA9ED0wPXA9kD4wPlA8AEKAQuBDAEMgQ0BDwEAgREBEYESARKBEwEWgRcBF4EYARiBGQEZgRoBGsEbQRuhFiEmoSchJ6EoISihKUEpwSpBKsErQSvBLEEswS1BLcEuQS7BL0EvwSBBMMExQTHBMkEywTNBM8E0QTTBNUE1wTZBNsE3QTfBOEE4wTlBOcE6QTrBO0E7wTxBPME9QTCBQQFBgUIBQoFDAUOBRAFEgUUBRYFGAUaBRwFHgUgBSIFJAUmBSgFKgUsBS4FMAUyBTQFNgU4BToFPAU+BQAFQgVEBUYFSAVKBUwFTgVQBVIFVAVWBVgFWgVcBV4FYAViBWQFZgVoBWsFbQVuhXCFcoV0hXaFeIV6hXyFfoVAhYKFhIWGhYiFioWahZyFnoWghaKFpQWnBakFqwWvBYgGCgYMBg4GEAYSBhQGFgYYBhoGHAYeBiAGIgYkBiYGKAYqBiwGLgYwBjIGNAY2BjgGOgY8Bj4GAAZCBkQGRgZIBkoGTAZOBlAGUgZUBlYGWAZaBlwGXgZgBmIGZAZmBmgGawZtBm6GcIZyhnSGdoZ4hnqGfIZ+hkCGgoaEhoaGiIachp6GswaMBw4HEAcSBxQHFgcYBxoHHAceByAHIgckByYHKAcqBywHLgcwBzIHNAc2BzgHOgc8Bz4HAAdEB0gHSgdMB04HUAdcB14HYAdiB3CHcod0h0iHioeMh46HkIeSh5SHloeah5yHnoegh6KHpQenB6kHqwetB68HsQezB7UHtwe5B7sHvQe/B4EHwwfFB8cHyQfLB80HzwfRB9MH1QfXB9kH2wfdB98H4QfjB+UH5wfpB+sH7QfvB/EH8wf1B/cH+Qf7B/0HzAgOCBAIEggUCBYIGAgaCBwIHgggCCIIJAgmCCgIKggsCC4IMAgyCDQINgg4CDoIPAgECEgISghQCFwIXghgCESIhoiIiIqIkIiSiJSIloiYiJqInIieiKCIooilCKcIqQirCK0IrwixCLMItQi3CLkIuwi9CL8IgQjDCMUIxwjJCMsIzQjPCNEI0wjVCNcI2QjbCN0I3wjhCOMI5QjnCOkI6wjtCO8I8QjzCPUI9wj5CPsIygkMCQ4JEAkSCRQJFgkcCR4JIAkiCSQJJgkoCSoJLAkuCTAJMgk0CTYJOAk6CTwJCglMCUSJhomIiYqJjImUiZaJmImaiZyJnomgiaKJpQmnCakJqwmtCa8JsQmzCbUJtwm5CbsJvQm/CYEJwwnFCccJyQnLCc0JzwnRCdMJ1QnXCdkJ2wndCd8J4QnjCeUJ5wnpCesJ7QnzCdAKIgokCiYKKAoqCiwKLgowCjIKNAo2CjgKOgo8CgoKTApOClAKUgp8ikiKioqSipSKloqYipqKnIqeiqCKooqlCqcKqQqrCq0KrwqxCrMKtQq3CrkKuwq9Cr8KgQrDCsUKxwrJCssKzQrPCtEK0wrVCtcK2QrbCt0K3wrhCu8K8QriCyQLJgsoCyoLLAsuCzALMgs0CzYLOAs6CzwLPgsAC0ILSgtMC04LUAtSC1QLfItOi5CLkouUi5aLmIuai5yLnougi6KLpQunC6kLqwutC68LsQuzC7ULtwu5C7sLvQu/C4ELwwvFC8cLyQvLC80LzwvRC9ML1QvXC9kL2wvdC98L7wvxC+QMJgwoDCoMLAwuDDAMMgw0DDYMOAw6DDwMPgwADEIMRAxIDEoMTAxODFAMUgxUDFYMeox8jH6MRIyGjIiMioyMjI6MkIySjJSMloyYjJqMnIyejKCMooylDKcMqQyrDK0MrwyxDLMMtQy3DLkMuwy9DL8MgQzDDMUMxwzJDMsMzQzPDNEM0wzVDNcM2QzbDN0M3wzhDOMM7wzmDSgNKg0sDS4NMA0yDTQNNg04DToNPA0+DQANQg1EDUYNSA1KDUwNTg1QDVINVA18jX6NQo2EjYaNiI2KjYyNjo2QjZKNlI2WjZiNmo2cjZ6NoI2ijaUNpw2pDasNrQ2vDbENsw21DbcNuQ27Db0Nvw2BDcMNxQ3HDckNyw3NDc8N0Q3TDdUN1w3ZDdsN3Q3fDeEN4w3lDeoOLA4uDjAOMg40DjYOOA46DjwOPg4ADkIORA5GDkgOSg5MDk4OUA5WDlgOfo5AjoKOhI6GjoiOio6Mjo6OkI6SjpSOlo6YjpqOnI6ejqCOoo6lDqcOqQ6rDq0Orw6xDrMOtQ63DrkOuw69Dr8OgQ7DDsUOxw7JDssOzQ7PDtEO0w7VDtcO2Q7bDt0O3w7hDugPKg8sDy4PMA8yDzQPNg84DzoPPA8+DwAPQg9ED0YPSA9KD0wPTg9QD1IPfo9Aj4KPhI+Gj4iPio+Mj46PkI+Sj5SPlo+Yj5qPnI+ej6CPoo+lD6cPqQ+rD60Prw+xD7MPtQ+3D7kPuw+9D78PgQ/DD8UPxw/JD8sPzQ/PD9EP0w/VD9cP2Q/bD90P3w/hD+UP6BAqECwQLhAwEDIQNBA2EDgQOhA8ED4QABBCEEQQRhBIEEoQTBBOEECQgpCEkIaQipCMkI6QkJCSkJqQnJCekKCQopClEKcQqRCrEK0QrxCxELMQtRC3ELkQuxC9EL8QgRDDEMUQxxDJEMsQzRDPENEQ0xDVENcQ2RDbEN0Q3xDlEOgRKhEsES4RMBEyETQRNhE4EToRPBE+EQARQhFEEUYRSBFKEUwRepF8kX6RQJGIkY6RkJGSkZ6RoJGikaURpxGpEasRrRGvEbERsxG1EbcRuRG7Eb0RvxGBEcMRxRHHEckRyxHNEc8R0RHTEdUR1xHZEdsR4xHlEegSKhIsEi4SMBIyEjQSNhI4EjoSPBI+EgASQhJEEkYSSBJKEnqSfJJ+kkqSjpKSkpSSlpKYkpqSnJKekqCSopKlEqcSqRKrEq0SrxKxErMStRK3ErkSuxK9Er8SgRLDEsUSxxLJEssSzRLPEtES0xLXEtkS4xLqEywTLhMwEzITNBM2EzgTOhM8Ez4TABNCE0QTRhNIE3qTfJN+k0iTkpOUk5aTmJOak5yTnpOgk6KTpROnE6kTqxOtE68TsROzE7UTtxO5E7sTvRO/E4ETwxPFE8cTyRPLE80TzxPRE9MT2RPjE+oULBQuFDAUMhQ0FDYUOBQ6FDwUPhQAFEIURBRGFEgUfpRAlIKUhJSGlJqUnJSelKCUopSlFKcUqRSrFK0UrxSxFLMUtRS3FLkUuxS9FL8UgRTDFMUUxxTJFMsUzRTPFNEU0xTbFN8U4RTjFO4VMBUyFTQVNhU4FToVPBU+FQAVQhVEFUYVetV81X7VQNWC1YTVhtWY1ZrVnNWe1aDVotWk1acVqRWrFa0VrxWxFbMVtRW3FbkVuxW9Fb8VgRXDFcUVxxXJFcsVzRXPFdEV0xXVFfAWMhY0FjYWOBY6FjwWPhYAFkIWRBZ61nzWftZA1oLWhNaG1ojWitaO1pDWktaU1pbWmNaa1pzWntag1qLWpNanFqkWqxatFq8WsRazFrUWtxa5FrsWvRa/FoEWwxbFFscWyRbLFs0WzxbRFtMW1RbwFzIXNBc2FzgXOhc413rXfNd+10DXgteE14bXiNeK14zXjteQ15LXlNeW15jXmtec157XoNek16cXqRerF60XrxexF7MXtRe3F7kXuxe9F78XgRfDF8UXxxfJF8sXzRfPF9EX0xfVF/AYMhg0GDYYOBg6GAYYSBh22HjYeth82H7YQNiC2ITYhtiI2IrYjNiO2JDYktiU2JbYmtic2J7YoNii2KkYqxitGK8YsRizGLUYtxi5GLsYvRi/GIEYwxjFGMcYyRjLGM0YzxjRGNMY9Bk2GTgZOhkIGXbZeNl62XzZftlA2YLZhNmG2YjZitmM2Y7ZkNmS2ZTZltma2ZzZntmg2aLZpxmxGbMZtRm3GbkZuxm9Gb8ZgRnDGcUZxxnJGcsZzRnPGdEZ0xn2GjgaBBpGGkgadNp22njaetp82n7aQNqC2oTahtqI2orajNqO2pDaktqU2pbamNqc2p7aoNqi2qTapxqpGrEasxq1GrcauRq7Gr0avxqBGsMaxRrHGskayxrNGs8a9hs4GzobABtKG3Tbdtt423rbfNt+20DbgtuE24bbiNuK24zbjtuQ25LblNuW25jbnNue26Dbotuk26cbtRu3G7kbuxuDG8UbxxvJG/gcOhw8HD4cABx03HbceNx63HzcftxA3ILchNyG3IjcityM3I7ckNyS3JTcltyY3Jrcntyg3KLcpNynHLUctxy5HIMcxRzHHMkcyxzVHP4dAB1CHXTddt143XrdfN1+3UDdgt2E3YbdiN2K3Yzdjt2Q3ZLdlN2W3Zjdmt2e3aDdot21HbcdhR3HHckdyx3VHcIeRB503nbeeN563nzeft5A3oLehN6G3ojeit6M3o7ekN6S3pTelt6Y3prenN6e3rUetx6JHssezR7VHtcezF9OX3bfeN9633zfft9A34LfhN+G34jfit+M347fkN+S35Tflt+Y35rfnN+i37cfiR/LH8ZgSGBKYExgTmBQYFJgVGB24HjgeuB84H7gQOCC4ITghuCI4IrgjOCO4JDgkuCU4JbgmOCa4JzgnuCg4KLgtyC5IJMg2SDKYUxhTmFQYVJhVGFWYXjheuF84X7hQOGC4YThhuGI4YrhjOGO4ZDhkuGU4ZbhmOGa4ZzhnuGg4bkhhyHZIcpiTGJOYlBiUmJUYlZiWGJaYkbiiOKK4ozijuKQ4pLilOKW4pjimuKc4p7ioOKFIsci0SLTIshjSmNMY05jUGNSY1RjVmNYY1pjRuOI44rjjOOO45DjkuOU45bjmOOa45zjnuOJI88j0SPTI8hkSmRMZE5kUGRSZFRkVmRYZFpkRuSI5IrkjOSO5JDkkuSU5JbkmOSa5JzkhyTJJM0kzyTRJMZlSGVKZUxlTmVQZVJlVGVWZVhlWmVcZV5lRuWI5YrljOWO5ZDlkuWU5ZblmOWa5YklzyXRJdUl4SXGZkhmSmZMZk5mUGZSZlRmVmZYZlpmXGZeZmBmYmZkZkjmiuaM5o7mkOaS5pTmluaY5prmiSbhJuMm5SbrJshnSmdMZ05nUGdSZ1RnVmdYZ1pnXGdeZ2BnYmdkZ2ZnSOeK54znjueQ55LnlOeW55jnmueLJ+Mn5SfnJ8hoSmhMaE5oUGhSaFRoVmhYaFpoXGheaGBoYmhkaGZoSuiM6I7okOiS6JToluiY6JrokyjZKOUoymlMaU5pUGlSaVRpVmlYaVppXGleaWBpYmlkaUrpjOmO6ZDpkumU6ZbpmOma6YpqTGpOalBqUmpUalZqWGpaalxqXmpgamJqSOqK6ozqjuqQ6pLqlOqW6pjqmuqi6p1q32rlasxrTmtQa1JrVGtWa1hrWmtca15rYGtia0jriuuM647rkOuS65TrluuY65rroOui65lr22vda99r5WvObFBsUmxUbFZsWGxabFxsXmxgbGJsSOyK7IzsjuyQ7JLslOyW7JjsoOyXbNls22zdbN9s4WzjbOVs52zObVBtUm1UbVZtWG1abVxtXm1gbWJtSu2M7Y7tkO2S7ZTtlu2g7ZVt123Zbdtt3W3fbeFt423lbedtzm5QblJuVG5WblhuWm5cbl5uYG5K7ozuju6Q7pLulO6W7pjunu6g7pFu027Vbtdu2W7bbt1u327hbuNu5W7nbuluzm9Qb1JvVG9Wb1hvWm9cb0rvjO+O75Dvku+U75bvnu+g75Fv02/Vb9dv2W/bb91v32/hb+Nv5W/nb+lv62/OcFBwUnBUcFZwWHBacFxwSvCM8I7wkPCS8JTwlvCRcNNw1XDXcNlw23DdcN9w4XDjcOVw53DpcOtwznFQcVJxVHFWcVhxWnFccUzxjvGQ8ZLxlPGRcdNx1XHXcdlx23Hdcd9x4XHjceVx53HpcetxznJQclJyVHJWclhyWnJM8o7ykPKS8pTyk3LVctdy2XLbct1y33LhcuNy5XLnculy63LOc1BzUnNUc1ZzWHNM847zkPOS85Nz1XPXc+Nz5XPnc+lzzHROdFB0UnRUdFZ0Y3TldOd06XT7dMx1TnVQdVJ1VHVWdWV153Xpdcx2TnZQdlJ2THdOd1B3Undnd/l3zHhOeFB4d3jKeUx5TnlKekx6TnpxOox7TntMfE58Q==";

  // CONTINENT DEFINITIONS
  const CONTINENTS = {
    all: { id: 'all', name: 'All Continents', count: 66 },
    as:  { id: 'as',  name: 'Asia', count: 12, index: 4 },
    eu:  { id: 'eu',  name: 'Europe', count: 11, index: 2 },
    na:  { id: 'na',  name: 'North America', count: 11, index: 0 },
    sa:  { id: 'sa',  name: 'South America', count: 10, index: 1 },
    af:  { id: 'af',  name: 'Africa', count: 10, index: 3 },
    oc:  { id: 'oc',  name: 'Oceania', count: 10, index: 5 }
  };

  // 66 GLOBAL TIMEZONES (10-12 PREMIER HUBS PER CONTINENT)
  const TIMEZONE_DATA = {
    as: [
      { id: 'mumbai', name: 'Navi Mumbai', country: 'India', tz: 'Asia/Kolkata', label: 'IST', utc: '+05:30', lat: 19.0, lon: 73.0, home: true },
      { id: 'tokyo', name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', label: 'JST', utc: '+09:00', lat: 35.7, lon: 139.7 },
      { id: 'singapore', name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', label: 'SGT', utc: '+08:00', lat: 1.35, lon: 103.8 },
      { id: 'dubai', name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', label: 'GST', utc: '+04:00', lat: 25.2, lon: 55.3 },
      { id: 'seoul', name: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', label: 'KST', utc: '+09:00', lat: 37.6, lon: 127.0 },
      { id: 'shanghai', name: 'Shanghai', country: 'China', tz: 'Asia/Shanghai', label: 'CST', utc: '+08:00', lat: 31.2, lon: 121.5 },
      { id: 'hongkong', name: 'Hong Kong', country: 'China', tz: 'Asia/Hong_Kong', label: 'HKT', utc: '+08:00', lat: 22.3, lon: 114.2 },
      { id: 'bangkok', name: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', label: 'ICT', utc: '+07:00', lat: 13.8, lon: 100.5 },
      { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta', label: 'WIB', utc: '+07:00', lat: -6.2, lon: 106.8 },
      { id: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh', label: 'AST', utc: '+03:00', lat: 24.7, lon: 46.7 },
      { id: 'taipei', name: 'Taipei', country: 'Taiwan', tz: 'Asia/Taipei', label: 'CST', utc: '+08:00', lat: 25.0, lon: 121.5 },
      { id: 'almaty', name: 'Almaty', country: 'Kazakhstan', tz: 'Asia/Almaty', label: 'ALMT', utc: '+05:00', lat: 43.2, lon: 76.9 }
    ],
    eu: [
      { id: 'london', name: 'London', country: 'United Kingdom', tz: 'Europe/London', label: 'GMT/BST', utc: '+00:00', lat: 51.5, lon: -0.1 },
      { id: 'paris', name: 'Paris', country: 'France', tz: 'Europe/Paris', label: 'CET', utc: '+01:00', lat: 48.9, lon: 2.35 },
      { id: 'berlin', name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', label: 'CET', utc: '+01:00', lat: 52.5, lon: 13.4 },
      { id: 'zurich', name: 'Zurich', country: 'Switzerland', tz: 'Europe/Zurich', label: 'CET', utc: '+01:00', lat: 47.4, lon: 8.5 },
      { id: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', tz: 'Europe/Amsterdam', label: 'CET', utc: '+01:00', lat: 52.4, lon: 4.9 },
      { id: 'stockholm', name: 'Stockholm', country: 'Sweden', tz: 'Europe/Stockholm', label: 'CET', utc: '+01:00', lat: 59.3, lon: 18.1 },
      { id: 'madrid', name: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', label: 'CET', utc: '+01:00', lat: 40.4, lon: -3.7 },
      { id: 'rome', name: 'Rome', country: 'Italy', tz: 'Europe/Rome', label: 'CET', utc: '+01:00', lat: 41.9, lon: 12.5 },
      { id: 'dublin', name: 'Dublin', country: 'Ireland', tz: 'Europe/Dublin', label: 'IST', utc: '+00:00', lat: 53.3, lon: -6.3 },
      { id: 'warsaw', name: 'Warsaw', country: 'Poland', tz: 'Europe/Warsaw', label: 'CET', utc: '+01:00', lat: 52.2, lon: 21.0 },
      { id: 'athens', name: 'Athens', country: 'Greece', tz: 'Europe/Athens', label: 'EET', utc: '+02:00', lat: 38.0, lon: 23.7 }
    ],
    na: [
      { id: 'sf', name: 'San Francisco', country: 'USA', tz: 'America/Los_Angeles', label: 'PST/PDT', utc: '-08:00', lat: 37.8, lon: -122.4 },
      { id: 'nyc', name: 'New York', country: 'USA', tz: 'America/New_York', label: 'EST/EDT', utc: '-05:00', lat: 40.7, lon: -74.0 },
      { id: 'la', name: 'Los Angeles', country: 'USA', tz: 'America/Los_Angeles', label: 'PST/PDT', utc: '-08:00', lat: 34.1, lon: -118.2 },
      { id: 'chicago', name: 'Chicago', country: 'USA', tz: 'America/Chicago', label: 'CST/CDT', utc: '-06:00', lat: 41.9, lon: -87.6 },
      { id: 'seattle', name: 'Seattle', country: 'USA', tz: 'America/Los_Angeles', label: 'PST/PDT', utc: '-08:00', lat: 47.6, lon: -122.3 },
      { id: 'austin', name: 'Austin', country: 'USA', tz: 'America/Chicago', label: 'CST/CDT', utc: '-06:00', lat: 30.3, lon: -97.7 },
      { id: 'toronto', name: 'Toronto', country: 'Canada', tz: 'America/Toronto', label: 'EST/EDT', utc: '-05:00', lat: 43.7, lon: -79.4 },
      { id: 'vancouver', name: 'Vancouver', country: 'Canada', tz: 'America/Vancouver', label: 'PST/PDT', utc: '-08:00', lat: 49.3, lon: -123.1 },
      { id: 'boston', name: 'Boston', country: 'USA', tz: 'America/New_York', label: 'EST/EDT', utc: '-05:00', lat: 42.4, lon: -71.1 },
      { id: 'mexico', name: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', label: 'CST', utc: '-06:00', lat: 19.4, lon: -99.1 },
      { id: 'denver', name: 'Denver', country: 'USA', tz: 'America/Denver', label: 'MST/MDT', utc: '-07:00', lat: 39.7, lon: -105.0 }
    ],
    sa: [
      { id: 'saopaulo', name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', label: 'BRT', utc: '-03:00', lat: -23.5, lon: -46.6 },
      { id: 'buenosaires', name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', label: 'ART', utc: '-03:00', lat: -34.6, lon: -58.4 },
      { id: 'santiago', name: 'Santiago', country: 'Chile', tz: 'America/Santiago', label: 'CLT', utc: '-04:00', lat: -33.4, lon: -70.7 },
      { id: 'bogota', name: 'Bogotá', country: 'Colombia', tz: 'America/Bogota', label: 'COT', utc: '-05:00', lat: 4.7, lon: -74.1 },
      { id: 'lima', name: 'Lima', country: 'Peru', tz: 'America/Lima', label: 'PET', utc: '-05:00', lat: -12.0, lon: -77.0 },
      { id: 'rio', name: 'Rio de Janeiro', country: 'Brazil', tz: 'America/Sao_Paulo', label: 'BRT', utc: '-03:00', lat: -22.9, lon: -43.2 },
      { id: 'montevideo', name: 'Montevideo', country: 'Uruguay', tz: 'America/Montevideo', label: 'UYT', utc: '-03:00', lat: -34.9, lon: -56.2 },
      { id: 'caracas', name: 'Caracas', country: 'Venezuela', tz: 'America/Caracas', label: 'VET', utc: '-04:00', lat: 10.5, lon: -66.9 },
      { id: 'quito', name: 'Quito', country: 'Ecuador', tz: 'America/Guayaquil', label: 'ECT', utc: '-05:00', lat: -0.2, lon: -78.5 },
      { id: 'medellin', name: 'Medellín', country: 'Colombia', tz: 'America/Bogota', label: 'COT', utc: '-05:00', lat: 6.2, lon: -75.6 }
    ],
    af: [
      { id: 'cairo', name: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', label: 'EET', utc: '+02:00', lat: 30.0, lon: 31.2 },
      { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', tz: 'Africa/Johannesburg', label: 'SAST', utc: '+02:00', lat: -26.2, lon: 28.0 },
      { id: 'lagos', name: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', label: 'WAT', utc: '+01:00', lat: 6.5, lon: 3.4 },
      { id: 'nairobi', name: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', label: 'EAT', utc: '+03:00', lat: -1.3, lon: 36.8 },
      { id: 'casablanca', name: 'Casablanca', country: 'Morocco', tz: 'Africa/Casablanca', label: 'WEST', utc: '+01:00', lat: 33.6, lon: -7.6 },
      { id: 'accra', name: 'Accra', country: 'Ghana', tz: 'Africa/Accra', label: 'GMT', utc: '+00:00', lat: 5.6, lon: -0.2 },
      { id: 'addis', name: 'Addis Ababa', country: 'Ethiopia', tz: 'Africa/Addis_Ababa', label: 'EAT', utc: '+03:00', lat: 9.0, lon: 38.7 },
      { id: 'kigali', name: 'Kigali', country: 'Rwanda', tz: 'Africa/Kigali', label: 'CAT', utc: '+02:00', lat: -1.9, lon: 30.1 },
      { id: 'dakar', name: 'Dakar', country: 'Senegal', tz: 'Africa/Dakar', label: 'GMT', utc: '+00:00', lat: 14.7, lon: -17.4 },
      { id: 'tunis', name: 'Tunis', country: 'Tunisia', tz: 'Africa/Tunis', label: 'CET', utc: '+01:00', lat: 36.8, lon: 10.2 }
    ],
    oc: [
      { id: 'sydney', name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', label: 'AEST', utc: '+10:00', lat: -33.9, lon: 151.2 },
      { id: 'melbourne', name: 'Melbourne', country: 'Australia', tz: 'Australia/Melbourne', label: 'AEST', utc: '+10:00', lat: -37.8, lon: 144.9 },
      { id: 'auckland', name: 'Auckland', country: 'New Zealand', tz: 'Pacific/Auckland', label: 'NZST', utc: '+12:00', lat: -36.8, lon: 174.8 },
      { id: 'brisbane', name: 'Brisbane', country: 'Australia', tz: 'Australia/Brisbane', label: 'AEST', utc: '+10:00', lat: -27.5, lon: 153.0 },
      { id: 'perth', name: 'Perth', country: 'Australia', tz: 'Australia/Perth', label: 'AWST', utc: '+08:00', lat: -31.9, lon: 115.8 },
      { id: 'adelaide', name: 'Adelaide', country: 'Australia', tz: 'Australia/Adelaide', label: 'ACST', utc: '+09:30', lat: -34.9, lon: 138.6 },
      { id: 'honolulu', name: 'Honolulu', country: 'Hawaii, USA', tz: 'Pacific/Honolulu', label: 'HST', utc: '-10:00', lat: 21.3, lon: -157.8 },
      { id: 'suva', name: 'Suva', country: 'Fiji', tz: 'Pacific/Fiji', label: 'FJT', utc: '+12:00', lat: -18.1, lon: 178.4 },
      { id: 'christchurch', name: 'Christchurch', country: 'New Zealand', tz: 'Pacific/Auckland', label: 'NZST', utc: '+12:00', lat: -43.5, lon: 172.6 },
      { id: 'portmoresby', name: 'Port Moresby', country: 'Papua New Guinea', tz: 'Pacific/Port_Moresby', label: 'PGT', utc: '+10:00', lat: -9.4, lon: 147.2 }
    ]
  };

  class WorldClockTelemetryEngine {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.dots = [];
      this.activeContinent = 'all';
      this.activeCity = TIMEZONE_DATA.as[0]; // Navi Mumbai [Home Hub] by default
      this.hoveredCity = null;

      // Pulse animation state
      this.time = 0;
      this.rippleRadius = 0;
      this.isInteracting = false;
      this.cachedTime = '';
      this.cachedSub = '';

      this.init();
    }

    init() {
      this.canvas = document.getElementById('world-map-canvas');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.decodePackedDots();
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });

      this.setupDOM();
      this.setupInteractions();

      // Start 240Hz Render Loop
      this.render = this.render.bind(this);
      requestAnimationFrame(this.render);
    }

    decodePackedDots() {
      try {
        const binStr = atob(PACKED_DOTS_B64);
        const count = binStr.length / 2;
        this.dots = new Array(count);

        for (let i = 0; i < count; i++) {
          const val = binStr.charCodeAt(i * 2) | (binStr.charCodeAt(i * 2 + 1) << 8);
          const row = (val >> 10) & 63;
          const col = (val >> 3) & 127;
          const contIdx = val & 7;

          this.dots[i] = {
            normX: col / 127,
            normY: row / 63,
            contIdx: contIdx,
            baseAlpha: 0.22 + Math.random() * 0.15
          };
        }
      } catch (e) {
        console.error('Failed to unpack world continent dots:', e);
      }
    }

    resizeCanvas() {
      const container = this.canvas.parentElement;
      if (!container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      const w = Math.max(320, rect.width);
      const h = Math.round(w * 0.52); // Standard equirectangular ratio

      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(dpr, dpr);
      this.W = w;
      this.H = h;
    }

    setupDOM() {
      this.clockDigitsEl = document.getElementById('water-clock-digits');
      this.clockSubEl = document.getElementById('water-clock-sub');
      this.clockCityEl = document.getElementById('water-clock-city');
      this.clockTzEl = document.getElementById('water-clock-tz');
      this.clockCoordsEl = document.getElementById('water-clock-coords');
      this.clockSolarEl = document.getElementById('water-clock-solar');
      this.chipsGridEl = document.getElementById('timezone-chips-grid');

      // Populate Continent Filter Tabs
      const tabs = document.querySelectorAll('.continent-tab');
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const cont = tab.getAttribute('data-cont') || 'all';
          this.switchContinent(cont);
          if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
            window.AudioEngine.playClick();
          }
        });
      });

      this.renderCityChips();
      this.updateClockDisplay();
    }

    switchContinent(contKey) {
      this.activeContinent = contKey;
      if (contKey !== 'all' && TIMEZONE_DATA[contKey] && TIMEZONE_DATA[contKey].length) {
        // Automatically set first city or maintain current if in same continent
        const inCont = TIMEZONE_DATA[contKey].some(c => c.id === this.activeCity.id);
        if (!inCont) {
          this.selectCity(TIMEZONE_DATA[contKey][0]);
        }
      }
      this.renderCityChips();
      this.triggerMapPulse();
    }

    renderCityChips() {
      if (!this.chipsGridEl) return;
      this.chipsGridEl.innerHTML = '';

      let citiesToRender = [];
      if (this.activeContinent === 'all') {
        // Render 2 major hubs per continent for a comprehensive global grid
        Object.keys(TIMEZONE_DATA).forEach(k => {
          citiesToRender.push(TIMEZONE_DATA[k][0]);
          citiesToRender.push(TIMEZONE_DATA[k][1]);
        });
      } else if (TIMEZONE_DATA[this.activeContinent]) {
        citiesToRender = TIMEZONE_DATA[this.activeContinent];
      }

      citiesToRender.forEach((city) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `tz-chip ${city.id === this.activeCity.id ? 'active' : ''} ${city.home ? 'is-home' : ''}`;
        btn.setAttribute('data-city-id', city.id);

        btn.innerHTML = `
          <div class="tz-chip-top">
            <span class="tz-chip-name">${city.name}</span>
            <span class="tz-chip-tag font-mono">${city.label}</span>
          </div>
          <div class="tz-chip-time font-mono" id="chip-time-${city.id}">--:--:--</div>
        `;

        btn.addEventListener('click', () => {
          this.selectCity(city);
          if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
            window.AudioEngine.playClick();
          }
        });

        this.chipsGridEl.appendChild(btn);
      });

      this.updateChipTimes();
    }

    selectCity(city) {
      this.activeCity = city;

      // Update chip highlights
      const chips = document.querySelectorAll('.tz-chip');
      chips.forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-city-id') === city.id);
      });

      this.triggerMapPulse();
      this.updateClockDisplay();
    }

    triggerMapPulse() {
      this.rippleRadius = 4;
    }

    setupInteractions() {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check proximity to any city pin in active view
        const allCities = this.getAllActiveCities();
        let found = null;
        let minDist = 18;

        for (let i = 0; i < allCities.length; i++) {
          const c = allCities[i];
          const pos = this.geoToScreen(c.lat, c.lon);
          const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
          if (dist < minDist) {
            minDist = dist;
            found = c;
          }
        }

        this.hoveredCity = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';
      });

      this.canvas.addEventListener('click', () => {
        if (this.hoveredCity) {
          this.selectCity(this.hoveredCity);
          if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
            window.AudioEngine.playClick();
          }
        }
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.hoveredCity = null;
      });
    }

    getAllActiveCities() {
      if (this.activeContinent === 'all') {
        let list = [];
        Object.keys(TIMEZONE_DATA).forEach(k => list = list.concat(TIMEZONE_DATA[k]));
        return list;
      }
      return TIMEZONE_DATA[this.activeContinent] || [];
    }

    geoToScreen(lat, lon) {
      // Maps latitude [-60, 80] and longitude [-180, 180] to [0, W] and [0, H]
      const normX = (lon + 180) / 360;
      const normY = (80 - lat) / 140;
      return {
        x: normX * this.W,
        y: normY * this.H
      };
    }

    /**
     * Updates the fluid 24HR water clock with local time in active timezone
     */
    updateClockDisplay() {
      if (!this.activeCity) return;
      const now = new Date();

      try {
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: this.activeCity.tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const timeParts = formatter.format(now);
        const ms = String(Math.floor((now.getMilliseconds() / 10))).padStart(2, '0');

        if (this.clockDigitsEl) this.clockDigitsEl.textContent = timeParts;
        if (this.clockSubEl) this.clockSubEl.textContent = `.${ms}`;

        if (this.clockCityEl) {
          this.clockCityEl.textContent = `${this.activeCity.name.toUpperCase()}, ${this.activeCity.country.toUpperCase()}${this.activeCity.home ? ' [HOME HUB]' : ''}`;
        }
        if (this.clockTzEl) {
          this.clockTzEl.textContent = `${this.activeCity.label} (UTC ${this.activeCity.utc})`;
        }
        if (this.clockCoordsEl) {
          const latDir = this.activeCity.lat >= 0 ? 'N' : 'S';
          const lonDir = this.activeCity.lon >= 0 ? 'E' : 'W';
          this.clockCoordsEl.textContent = `${Math.abs(this.activeCity.lat).toFixed(4)}° ${latDir}, ${Math.abs(this.activeCity.lon).toFixed(4)}° ${lonDir}`;
        }

        // Solar daylight estimate
        const hour = parseInt(timeParts.split(':')[0], 10);
        const isDay = hour >= 6 && hour < 19;
        if (this.clockSolarEl) {
          this.clockSolarEl.textContent = isDay ? '● SOLAR: DAY PHASE' : '● SOLAR: NIGHT PHASE';
          this.clockSolarEl.className = `solar-indicator font-mono ${isDay ? 'day' : 'night'}`;
        }
      } catch (err) {
        // Fallback
      }
    }

    updateChipTimes() {
      const now = new Date();
      const chips = document.querySelectorAll('.tz-chip');
      chips.forEach(chip => {
        const id = chip.getAttribute('data-city-id');
        const timeEl = document.getElementById(`chip-time-${id}`);
        if (!timeEl) return;

        // Find city config
        let targetCity = null;
        Object.keys(TIMEZONE_DATA).some(k => {
          targetCity = TIMEZONE_DATA[k].find(c => c.id === id);
          return !!targetCity;
        });

        if (targetCity) {
          try {
            const fmt = new Intl.DateTimeFormat('en-GB', {
              timeZone: targetCity.tz,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
            timeEl.textContent = fmt.format(now);
          } catch (e) {}
        }
      });
    }

    render() {
      this.time += 0.016;

      // Update 24hr Clock UI every frame
      this.updateClockDisplay();

      // Update chip mini-clocks once per second
      if (Math.floor(this.time * 60) % 30 === 0) {
        this.updateChipTimes();
      }

      const ctx = this.ctx;
      const W = this.W;
      const H = this.H;

      // 1. Clear Map Canvas to pure void
      ctx.clearRect(0, 0, W, H);

      // Subtle background grid lattice
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 0.5;
      const gridCols = 16;
      const gridRows = 8;
      for (let i = 1; i < gridCols; i++) {
        const gx = (i / gridCols) * W;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let j = 1; j < gridRows; j++) {
        const gy = (j / gridRows) * H;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      ctx.restore();

      // 2. Render Real-Time Day/Night Solar Terminator Shadow
      this.renderSolarTerminator(ctx, W, H);

      // 3. Render 2,426 Pixel Land Dots
      const activeIdx = CONTINENTS[this.activeContinent] ? CONTINENTS[this.activeContinent].index : -1;
      const dotSize = Math.max(1.2, W / 135);

      for (let i = 0; i < this.dots.length; i++) {
        const d = this.dots[i];
        const dx = d.normX * W;
        const dy = d.normY * H;

        // Determine if dot belongs to active continent filter
        const isContinentActive = (activeIdx === -1) || (d.contIdx === activeIdx);

        ctx.fillStyle = isContinentActive
          ? (d.contIdx === 4 ? 'rgba(0, 240, 255, 0.75)' : 'rgba(255, 255, 255, 0.75)') // Accent Asia/Home
          : 'rgba(255, 255, 255, 0.12)';

        // Draw crisp digital pixel dot
        ctx.fillRect(dx - dotSize / 2, dy - dotSize / 2, dotSize, dotSize);
      }

      // 4. Render City Pins with Sonar Waves & Radar rings
      const visibleCities = this.getAllActiveCities();
      for (let i = 0; i < visibleCities.length; i++) {
        const city = visibleCities[i];
        const pos = this.geoToScreen(city.lat, city.lon);
        const isSelected = city.id === this.activeCity.id;
        const isHovered = this.hoveredCity && city.id === this.hoveredCity.id;

        ctx.save();

        if (isSelected) {
          // Expanding Sonar Ping Wave from Active City
          this.rippleRadius += 0.8;
          if (this.rippleRadius > 45) this.rippleRadius = 4;
          const pingAlpha = Math.max(0, 1.0 - this.rippleRadius / 45);

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, this.rippleRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 240, 255, ${pingAlpha * 0.85})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          // Second harmonic ring
          const ring2 = (this.rippleRadius + 22) % 45;
          const ring2Alpha = Math.max(0, 1.0 - ring2 / 45);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, ring2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${ring2Alpha * 0.5})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();

          // Glowing Solid Core Pin
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.0, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Floating City Label on Active Node
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.fillText(city.name.toUpperCase(), pos.x + 8, pos.y - 6);
        } else {
          // Standard city dot
          const pinR = isHovered ? 3.5 : 2.2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, pinR, 0, Math.PI * 2);
          ctx.fillStyle = isHovered ? '#00f0ff' : (city.home ? 'rgba(0, 240, 255, 0.8)' : 'rgba(255, 255, 255, 0.65)');
          ctx.fill();

          if (isHovered) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 5. Render Hover Tooltip
      if (this.hoveredCity && this.hoveredCity.id !== this.activeCity.id) {
        const pos = this.geoToScreen(this.hoveredCity.lat, this.hoveredCity.lon);
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        const label = `${this.hoveredCity.name} [${this.hoveredCity.label}]`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.fillRect(pos.x + 10, pos.y - 24, textWidth + 14, 20);
        ctx.strokeRect(pos.x + 10, pos.y - 24, textWidth + 14, 20);

        ctx.fillStyle = '#00f0ff';
        ctx.fillText(label, pos.x + 17, pos.y - 10);
        ctx.restore();
      }

      requestAnimationFrame(this.render);
    }

    renderSolarTerminator(ctx, W, H) {
      const now = new Date();
      // Approximate solar subpoint longitude: at 12:00 UTC, sun is at lon 0
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
      const sunLon = (12 - utcHours) * 15; // 15 deg per hour
      const sunNormX = (sunLon + 180) / 360;

      // Night shadow overlay
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      const dayCenter = (sunNormX % 1 + 1) % 1;
      const nightCenter = (dayCenter + 0.5) % 1;

      // Soft night shade
      ctx.save();
      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      const nightX = nightCenter * W;
      ctx.fillRect(Math.max(0, nightX - W * 0.25), 0, W * 0.5, H);
      ctx.restore();
    }
  }

  // Auto-init on page load
  function startWorldClock() {
    window.WorldClockTelemetry = new WorldClockTelemetryEngine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWorldClock);
  } else {
    startWorldClock();
  }

})();
