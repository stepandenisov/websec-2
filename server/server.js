const express = require("express");
const fs = require("fs");
const axios = require("axios");
    
const app = express();
const jsonParser = express.json();
const idLetters = {
    "А": 1,
    "Б": 2,
    "В": 3,
    "Г": 4,
    "Д": 5,
    "Е": 6,
    "Ж": 7,
    "З": 8,
    "И": 9,
    "К": 10,
    "Л": 11,
    "М": 12,
    "Н": 13,
    "О": 14,
    "П": 15,
    "Р": 16,
    "С": 17,
    "Т": 18,
    "У": 19,
    "Ф": 20,
    "Х": 21,
    "Ц": 22,
    "Ч": 23,
    "Ш": 24,
    "Щ": 25,
    "Э": 26,
    "Ю": 27,
    "Я": 28,
}
  
async function getStaffSchedule (number) {
    try{
        const response = await axios.get(`https://ssau.ru/rasp?staffId=${number}/`)
        console.log('success'); // HTML
        return response.data
    }
    catch(e)
    {
        console.log(e);
    }
}

async function getGroupSchedule (number) {
    try{
        const response = await axios.get(`https://ssau.ru/rasp?groupId=${number}/`)
        console.log('success'); // HTML
        return response.data
    }
    catch(e)
    {
        console.log(e);
    }
}

async function getRequestToSSAU(request){
    try{
        const response = await axios.get(request)
        console.log(`succes request from: ${request}`)
        return response.data
    }
    catch(e)
    {
        console.log(e);
        return null
    }
}

async function getStaffId(name){
    const idLetter = idLetters[name[0].toUpperCase()]
    const responseData = await getRequestToSSAU(`https://ssau.ru/staff?letter=${idLetter}/`)
    const rawPageRegex = /https:\/\/ssau\.ru\/staff\?page=(\d?\d)&amp;letter=/g
    const rawPages = await responseData.match(rawPageRegex);
    const pagesNumberRegex = /(\d\d?)/g
    let pages = []
    for (let index = 0; index < rawPages.length; index++)
        pages.push(parseInt(await rawPages[index].match(pagesNumberRegex)))
    const maxPageNumber = Math.max(...pages)
    for (let pageNumber = 1; pageNumber <= maxPageNumber; pageNumber++){
        pageData = await getRequestToSSAU(`https://ssau.ru/staff?letter=${idLetter}&page=${pageNumber}`)
        //href="https://ssau.ru/staff/713280663-vdovina-galina-ilinichna">\nВдовина Галина Ильинична
        const regexStaff = /href="https:\/\/ssau\.ru\/staff\/(\d{8,9})-(.)*">\n.*\n/g
        const rawStaff = await pageData.match(regexStaff)
        for (let rawLecturerNumber = 0; rawLecturerNumber < rawStaff.length; rawLecturerNumber++){
            regexName = new RegExp(name)
            console.log(rawStaff[rawLecturerNumber])
            isTargetLecturer = await regexName.test(rawStaff[rawLecturerNumber])
            if (isTargetLecturer === true){
                const idStaffRegex = /(\d){8,9}/g
                staffId = await rawStaff[rawLecturerNumber].match(idStaffRegex)
                return parseInt(staffId)
            }
        }
    }
    return -1
}

async function getLecturerSchedule(staffId, selectedWeek, selectedWeekday){
    const responseData = await getRequestToSSAU(
        `https://ssau.ru/rasp?staffId=${staffId}&selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`)
    const rawScheduleRegex = /class="schedule__time-item">((.|\n)*)class="footer"/g
    const rawSchedule = await responseData.match(rawScheduleRegex)
    console.log(responseData)
    if (rawSchedule === null) return "Расписание не введено"
    const rawTimeScheduleRegex = /(\d\d:\d\d)((.|\n)(?!(\d\d:\d\d)))*/g
    const rawTimeSchedule = await rawSchedule[0].match(rawTimeScheduleRegex)
    rawSubjectsMatrix = []
    console.log(rawTimeSchedule)
    for (rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        //<div\nclass=\"schedule__item \">
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
    }   
    subjectsMatrix = []
    for (rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        for (rawSubjectIndex=0; rawSubjectIndex<rawSubjectsMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawSubjectNameRegex = /lesson-color-type-\d(.)*</g
            const subjectRegex = / ((.)*)(?!<\/div>)/g
            rawSubject = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectNameRegex)
            if(rawSubject !== null) {
                subject = await rawSubject[0].match(subjectRegex)
                subject = subject[0].replace(/<\/div></g,"").substring(1)
                subjectsMatrix[rawSubjectListNumber].push(subject)
            }
            else{
                subjectsMatrix[rawSubjectListNumber].push(null)
            }
        }
    }
    for (rawScheduleListNumber = 0; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber++){
        
    }
    return rawTimeSchedule
}
  
app.get("/group/:number", async function(req, res){
    const number = req.params.number;
    const data = await getGroupSchedule(number)
    res.send(data);
});
app.get("/staff/:name", async function(req, res){
    const name = req.params.name
    const staffId = await getStaffId(name);
    console.log(name)
    if (staffId===-1) res.send("No Lecturer")
    else{
        console.log(staffId)
        const lecturerSchedule = await getLecturerSchedule(staffId, 12, 5)
        res.send(lecturerSchedule);
    }
});

app.listen(3000, function(){
    console.log("Сервер ожидает подключения...");
});