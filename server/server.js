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
    timeMatrix = []
    lectorSchedule = []
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

            const rawGroupRegex = /href=\"\/rasp\?groupId=(.)*<\/a>/g
            const rawGroupNumberRegex = /schedule__group\">(.)*</g
            const rawGroupIdRegex = /\/rasp\?groupId=(\d)*/g
            const groupIdRegex = /(\d)+/g
            const groupNumberRegex = /(\d{4})-(\d{6})(\D)?( \(\d\))?/g
            rawGroup = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawGroupRegex)
            console.log(rawGroup)
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    rawGroupNumber = await rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    rawGroupId = await rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    console.log(rawGroupNumber[0])
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
    subjectsMatrix.forEach((subjectList, subjectListIndex) =>{
        lectorSchedule.push([])
        subjectList.forEach((subject, subjectIndex) =>{
            if(subject===null){
                lectorSchedule[subjectListIndex].push(null)
            }
            else{
                var element = new Object()
                    element.subject = JSON.stringify(subjectsMatrix[subjectListIndex][subjectIndex])
                    element.time = JSON.stringify(timeMatrix[subjectListIndex])
                    element.place = JSON.stringify(placeMatrix[subjectListIndex][subjectIndex])
                    element.groups = JSON.stringify(groupsMatrix[subjectListIndex][subjectIndex])
                    element.type = JSON.stringify(typeSubjectMatrix[subjectListIndex][subjectIndex])
                lectorSchedule[subjectListIndex].push(element)
            }
        })
    })
    t = transpose(lectorSchedule)
    return JSON.parse(JSON.stringify(t))
}

async function getGroupId(number){
    const responseData = await getRequestToSSAU(`https://ssau.ru/rasp`)
    const rawFacultiesRegex = /class="faculties"><h2((.|\n)*)class="footer"/g
    const rawFaculties = await responseData.match(rawFacultiesRegex);
    const rawFacultyNameRegex = /"h3-text"> (.)+ </g
    const rawFacultyIdRegex = /faculty\/(\d)+\?course/g
    const facultyIdRegex = /(\d)+/g
    const rawFacultiyNamesList = rawFaculties[0].match(rawFacultyNameRegex)
    const rawFacultiyIdList = rawFaculties[0].match(rawFacultyIdRegex)
    const faculties = []
    let groupId = -1
    const courseGroup = []
    for (let index = 0; index < rawFacultiyNamesList.length; index++){
        facultyName = rawFacultiyNamesList[index].substring(11). slice(0, -2)
        facultyId = rawFacultiyIdList[index].match(facultyIdRegex)
        faculties.push({facultyId: facultyId, facultyName: facultyName})
    }
    for (let facultyListIndex = 0; facultyListIndex < faculties.length; facultyListIndex++){
        const rawCourseRegex = /href="\/rasp\/faculty\/(.)*<\/nav><div/g
        const facultyCourseData = await getRequestToSSAU(`https://ssau.ru/rasp/faculty/${faculties[facultyListIndex]["facultyId"]}?course=1`)
        const rawCourse = facultyCourseData.match(rawCourseRegex)
        if(rawCourse === null) continue
        const rawCourseNumberRegex = /course=\d/g
        const rawCourseNumbers = rawCourse[0].match(rawCourseNumberRegex)
        const courseNumberRegex = /\d/g
        const maxCourseNumber = parseInt(rawCourseNumbers[0].match(courseNumberRegex))
        for (let course = 1; course <= maxCourseNumber; course++){
            const facultyGroupsData = await getRequestToSSAU(`https://ssau.ru/rasp/faculty/${faculties[facultyListIndex]["facultyId"]}?course=${course}`)
            const rawGroupsRegex = /href="\/rasp\?groupId=(\d)+"(.|\n)*class="footer"/g
            const rawGroups = facultyGroupsData.match(rawGroupsRegex)
            groupNumberRegex = /<span>(.)*<\/span>/g
            groupIdRegex = /groupId=(\d)+"/g
            const rawGroupNumbers = rawGroups[0].match(groupNumberRegex)
            const rawGroupIds = rawGroups[0].match(groupIdRegex)
            const groupNumbers =  []
            rawGroupNumbers.forEach(element => {
                groupNumbers.push(element.substring(6).slice(0, -7))
            });
            const groupIds = []
            rawGroupIds.forEach(element => {
                groupIds.push(element.substring(8).slice(0, -1))
            })
            groupNumbers.forEach((element, index, groupNumbers) => { courseGroup.push({groupNumber: element, groupId: groupIds[index]})});
            regexNumber = new RegExp(number)
            courseGroup.forEach((element) => {
                if (regexNumber.test(element["groupNumber"])){
                    groupId = element["groupId"]
                }
            })
        }   
    }
    return groupId
}

const transpose = matrix => matrix[0].map((col, i) => matrix.map(row => row[i]));

async function getGroupSchedule(groupId, selectedWeek, selectedWeekday){
    const responseData = await getRequestToSSAU(
        `https://ssau.ru/rasp?groupId=${groupId}&selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`)
    const rawScheduleRegex = /class="schedule__time-item">((.|\n)*)class="footer"/g
    const rawSchedule = await responseData.match(rawScheduleRegex)
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
    const rawAnotherSubjectMatrix = []
    timeMatrix = []
    for (rawScheduleListNumber = 1; rawScheduleListNumber < rawTimeSchedule.length; rawScheduleListNumber+=2){
        const subjectRegex = /<div(\n?)class="schedule__item((.|\n)(?!(<div(\n?)class="schedule__item)))*/g
        const anotherSubjectRegex = /schedule__item(.|\n)*?<\/div><\/div><\/div><div/g
        const timeRegex = /\d\d:\d\d/g
        startTime = await rawTimeSchedule[rawScheduleListNumber-1].match(timeRegex)
        finishTime = await rawTimeSchedule[rawScheduleListNumber].match(timeRegex)
        timeMatrix.push({startTime: startTime[0], finishTime: finishTime[0]})
        rawSubjectsMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(subjectRegex))
        rawAnotherSubjectMatrix.push(rawTimeSchedule[rawScheduleListNumber].match(anotherSubjectRegex))
    }   
    subjectsMatrix = []
    typeSubjectMatrix = []
    groupsMatrix = []
    placeMatrix = []
    lectorMatrix = []
    groupSchedule = []
    for (rawSubjectListNumber=0; rawSubjectListNumber<rawSubjectsMatrix.length; rawSubjectListNumber++){
        subjectsMatrix.push([])
        typeSubjectMatrix.push([])
        groupsMatrix.push([])
        placeMatrix.push([])
        lectorMatrix.push([])
        for (rawSubjectIndex=0; rawSubjectIndex<rawSubjectsMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawSubjectNameRegex = /lesson-color-type-\d(.)*</g
            const subjectRegex = / ((.)*)(?!<\/div>)/g
            rawSubject = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubjectNameRegex)
            if(rawSubject !== null) {
                subjectsMatrix[rawSubjectListNumber].push([])
                for (subjectIndex = 0; subjectIndex < rawSubject.length; subjectIndex++){
                    subject = await rawSubject[subjectIndex].match(subjectRegex)
                    subject = subject[0].replace(/<\/div></g,"").substring(1)
                    subjectsMatrix[rawSubjectListNumber][rawSubjectIndex].push(subject)
                }
            }
            else{
                subjectsMatrix[rawSubjectListNumber].push(null)
            }

            const rawTypeRegex = /lesson-color-type-\d/g
            const typeNumberRegex = /\d/g
            rawType = await rawSubjectsMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawTypeRegex)
            if(rawType !== null) {
                typeSubjectMatrix[rawSubjectListNumber].push([])
                for (typeIndex = 0; typeIndex < rawType.length; typeIndex++){
                    type = await rawType[typeIndex].match(typeNumberRegex)
                    typeSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].push(lessonTypes[type])
                }
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
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    rawGroupNumber = await rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    rawGroupId = await rawGroup[rawGroupIndex].match(rawGroupIdRegex)
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
                placeMatrix[rawSubjectListNumber].push([])
                for (rawPlaceIndex = 0; rawPlaceIndex < rawSubjectPlace.length; rawPlaceIndex++){
                    subjectPlace = await rawSubjectPlace[rawPlaceIndex].match(subjectPlaceRegex)
                    placeMatrix[rawSubjectListNumber][rawSubjectIndex].push(subjectPlace[0].substring(2).slice(0, -1))
                }
            }
            else{
                placeMatrix[rawSubjectListNumber].push(null)
            }
        }

        for(rawSubjectIndex=0; rawSubjectIndex<rawAnotherSubjectMatrix[rawSubjectListNumber].length; rawSubjectIndex++){
            const rawLectorNameRegex = /schedule__teacher(.|\n)*?<\/div>/g
            rawLectorName = rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawLectorNameRegex)
            if (rawLectorName !== null){
                let subGroup = []
                const rawSubGroupRegex = /Подгруппы: \d/g
                const rawSubGroup = await rawAnotherSubjectMatrix[rawSubjectListNumber][rawSubjectIndex].match(rawSubGroupRegex)
                if(rawSubGroup !== null){
                    const subGroupRegex = /\d/g
                    for (indexSub = 0; indexSub < rawSubGroup.length; indexSub++){
                        subGroup.push(rawSubGroup[indexSub].match(subGroupRegex)[0])
                    }
                }
                lectorMatrix[rawSubjectListNumber].push([])
                for (rawLectorIndex = 0; rawLectorIndex < rawLectorName.length; rawLectorIndex++){
                    const lectorNameRegex = />([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}</g
                    const lectorIdRegex = /(\d)+/g
                    const lectorName = rawLectorName[rawLectorIndex].match(lectorNameRegex)[0].substring(1).slice(0,-1) 
                    lectorId = rawLectorName[rawLectorIndex].match(lectorIdRegex)
                    if(lectorId === null){
                        lectorId = [-1]
                    }
                    if(subGroup.length === 0){
                        lectorMatrix[rawSubjectListNumber][rawSubjectIndex].push({lectorName: lectorName, lectorId: lectorId[0]})
                    }
                    else{
                        lectorMatrix[rawSubjectListNumber][rawSubjectIndex].push({lectorName: lectorName, lectorId: lectorId[0], subGroup: subGroup[rawLectorIndex]})
                    }
                }
            }
        }
    }
    subjectsMatrix.forEach((subjectList, subjectListIndex) =>{
        groupSchedule.push([])
        console.log(subjectList)
        subjectList.forEach((subject, subjectIndex) =>{
            console.log(subject)
            if(subject===null){
                console.log(subjectIndex)
                groupSchedule[subjectListIndex].push(null)
            }
            else{
                var element = new Object()
                    element.subject = JSON.stringify(subjectsMatrix[subjectListIndex][subjectIndex])
                    element.time = JSON.stringify(timeMatrix[subjectListIndex])
                    element.place = JSON.stringify(placeMatrix[subjectListIndex][subjectIndex])
                    element.lector = JSON.stringify(lectorMatrix[subjectListIndex][0])
                    lectorMatrix[subjectListIndex].shift()
                    element.groups = JSON.stringify(groupsMatrix[subjectListIndex][subjectIndex])
                    element.type = JSON.stringify(typeSubjectMatrix[subjectListIndex][subjectIndex])
                groupSchedule[subjectListIndex].push(element)
            }
        })
    })
    t = transpose(groupSchedule)
    return JSON.parse(JSON.stringify(t))
}

app.get("/group/:number", async function(req, res){
    const number = req.params.number;
    const groupId = await getGroupId(number)
    if (groupId===-1) res.send("No Group")
    else{
        console.log(groupId)
        const groupSchedule = await getGroupSchedule(groupId, 12, 1)
        res.send(groupSchedule);
    }
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