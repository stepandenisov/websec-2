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

const lessonTypes = {
    "1": "Лекция",
    "2": "Лабораторная",
    "3": "Практика",
    "4": "Другое",
    "5": "Экзамен/Консультация/Зачет",
    "6": "Курсовой проект"
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
        const regexStaff = /href="https:\/\/ssau\.ru\/staff\/(\d+)-(.)*">\n.*\n/g
        const rawStaff = await pageData.match(regexStaff)
        for (let rawLecturerNumber = 0; rawLecturerNumber < rawStaff.length; rawLecturerNumber++){
            regexName = new RegExp(name)
            console.log(rawStaff[rawLecturerNumber])
            isTargetLecturer = await regexName.test(rawStaff[rawLecturerNumber])
            if (isTargetLecturer === true){
                const idStaffRegex = /(\d)+/g
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
    console.log(staffId)
    if (rawSchedule === null){
        isIntroduced = (/расписание пока не введено/i).test(responseData)
        if(isIntroduced){
            return "Расписание не введено"
        }
        else{
            return []
        }
    } 
    const rawTimeScheduleRegex = /(\d\d:\d\d)((.|\n)(?!(\d\d:\d\d)))*/g
    const rawTimeSchedule = await rawSchedule[0].match(rawTimeScheduleRegex)
    rawSubjectsMatrix = []
    console.log(rawTimeSchedule)
    timeMatrix = []
    for (rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        const timeRegex = /\d\d:\d\d/g
        startTime = await rawTimeSchedule[rawScheduleListNumber-1].match(timeRegex)
        finishTime = await rawTimeSchedule[rawScheduleListNumber].match(timeRegex)
        timeMatrix.push([startTime[0], finishTime[0]])
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
    }   
    subjectsMatrix = []
    typeSubjectMatrix = []
    groupsMatrix = []
    placeMatrix = []
    for (rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        typeSubjectMatrix.push([])
        groupsMatrix.push([])
        placeMatrix.push([])
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

            const rawTypeRegex = /lesson-color-type-\d/g
            const typeNumberRegex = /\d/g
            rawType = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawTypeRegex)
            if(rawType !== null) {
                type = await rawType[0].match(typeNumberRegex)
                typeSubjectMatrix[rawSubjectListNumber].push(lessonTypes[type])
            }
            else{
                typeSubjectMatrix[rawSubjectListNumber].push(null)
            }

            const rawGroupRegex = /href=\"\/rasp\?groupId=(.)*>/g
            const rawGroupNumberRegex = /schedule__group\">(.)* /g
            const rawGroupIdRegex = /\/rasp\?groupId=(\d)*/g
            const groupIdRegex = /(\d)+/g
            const groupNumberRegex = /(\d{4})-(\d{6})(\D?)/g
            rawGroup = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawGroupRegex)
            console.log(rawGroup)
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    rawGroupNumber = await rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    rawGroupId = await rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    console.log(rawGroupNumber, rawGroupId)
                    groupNumber = await rawGroupNumber[0].match(groupNumberRegex)
                    groupId = await rawGroupId[0].match(groupIdRegex)
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push([{"groupNumber":groupNumber[0]},{"groupId": groupId}])
                }
            }
            else{
                groupsMatrix[rawSubjectListNumber].push(null)
            }

            const rawSubjectPlaceRegex = /schedule__place\">(.)*<\/div>/g
            const subjectPlaceRegex = />(.)*</g
            rawSubjectPlace = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectPlaceRegex)
            if (rawSubjectPlace!==null){
                subjectPlace = await rawSubjectPlace[0].match(subjectPlaceRegex)
                placeMatrix[rawSubjectListNumber].push(subjectPlace[0].substring(2).slice(0, -1))
            }
            else{
                placeMatrix[rawSubjectListNumber].push(null)
            }
        }
    }
    return subjectsMatrix
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
        const lecturerSchedule = await getLecturerSchedule(staffId, 6, 1)
        res.send(lecturerSchedule);
    }
});

app.listen(3000, function(){
    console.log("Сервер ожидает подключения...");
});