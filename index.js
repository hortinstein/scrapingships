const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const colors = require('colors');
const createClient =  require('@supabase/supabase-js').createClient
const fs = require('fs');
const crypto = require('crypto');
  

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const supabaseUrl = 'https://jxyvwtrmfrkwfcisuibl.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// https://supabase.com/docs/reference/javascript/insert
async function insertSupabase(tableName, recordArray){
  return { data, error } = await supabase
  .from(tableName)
  .insert(recordArray)
  .select()
}

function parseSchedule(shipInfoArray) {
    const shipHash = crypto.createHash('sha1').update(shipInfoArray.join()).digest('hex');
    const shipName = shipInfoArray[0];
    const shipPopulation = shipInfoArray[1].trim();
    const shipDateTimeString = shipInfoArray[3].trim();
    const shipDateEpoch = moment(shipDateTimeString, 'DD MMM YYYY - hh:mm').unix()
    return ({ 'hash':shipHash, 
              'name':shipName,
              'population':shipPopulation,
              'datestring':shipDateTimeString,
              'epoch':shipDateEpoch
            })
}

async function check_cruises(){
    axios.get('https://cruisedig.com/ports/tampa-florida')
        .then(response => {
            const html = response.data;    
            const $ = cheerio.load(html);
            //#port-arrivals > div > div > div > div > div.view-content > div > ul > li:nth-child(1) > div
            
            const scheduleArrivals = $('.view-port-schedule-arrivals .schedule');
            console.log('arrivals'.green);
            scheduleArrivals.each((index,el) => {
                const shipInfoArray = $(el).text().trim().split('\n');
                const shipInfoJSON = parseSchedule(shipInfoArray)
                insertSupabase('arrivals',shipInfoJSON).then(response => {
                    console.log(response);
                })
            })
            console.log('departures'.green);
            const scheduleDepartures = $('.view-port-schedule-departures .schedule');
            scheduleDepartures.each((index,el) => {
                const shipInfoArray = $(el).text().trim().split('\n');
                const shipInfoJSON = parseSchedule(shipInfoArray)
                insertSupabase('departures',shipInfoJSON).then(response => {
                    console.log(response);
                })

            })
        })
}

check_cruises();
