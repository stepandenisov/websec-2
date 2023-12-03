const {getContext, createDb, Op} = require("../database/db.js")
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require('cors')


const app = express();
app.use(cors())
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

// async function getStaffId(name){
//     const idLetter = idLetters[name[0].toUpperCase()]
//     const responseData = await getRequestToSSAU(`https://ssau.ru/staff?letter=${idLetter}/`)
//     const rawPageRegex = /https:\/\/ssau\.ru\/staff\?page=(\d?\d)&amp;letter=/g
//     const rawPages = await responseData.match(rawPageRegex);
//     const pagesNumberRegex = /(\d\d?)/g
//     let pages = []
//     for (let index = 0; index < rawPages.length; index++)
//         pages.push(parseInt(await rawPages[index].match(pagesNumberRegex)))
//     const maxPageNumber = Math.max(...pages)
//     for (let pageNumber = 1; pageNumber <= maxPageNumber; pageNumber++){
//         pageData = await getRequestToSSAU(`https://ssau.ru/staff?letter=${idLetter}&page=${pageNumber}`)
//         const regexStaff = /href="https:\/\/ssau\.ru\/staff\/(\d+)-(.)*">\n.*\n/g
//         const rawStaff = await pageData.match(regexStaff)
//         for (let rawLecturerNumber = 0; rawLecturerNumber < rawStaff.length; rawLecturerNumber++){
//             regexName = new RegExp(name)
//             console.log(rawStaff[rawLecturerNumber])
//             isTargetLecturer = await regexName.test(rawStaff[rawLecturerNumber])
//             if (isTargetLecturer === true){
//                 const idStaffRegex = /(\d)+/g
//                 staffId = await rawStaff[rawLecturerNumber].match(idStaffRegex)
//                 return parseInt(staffId)
//             }
//         }
//     }
//     return -1
// }

async function getStaff(){
    staffList = []
    for ([key, value] of Object.entries(idLetters)) {
        const idLetter = value
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
                const idStaffRegex = /(\d)+/g
                const nameStaffRegex = /([А-ЯЁ]|[а-яё]|(\.)|( )|(-)){4,}/g
                staffId = await rawStaff[rawLecturerNumber].match(idStaffRegex)
                staffName = await rawStaff[rawLecturerNumber].match(nameStaffRegex)
                staffPerson = {id: parseInt(staffId), name: staffName[0]}
                await staffList.push(staffPerson)
            }
        }
    }
    return staffList
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
            if (rawGroup!== null){
                groupsMatrix[rawSubjectListNumber].push([])
                for (rawGroupIndex = 0; rawGroupIndex < rawGroup.length; rawGroupIndex++){
                    rawGroupNumber = await rawGroup[rawGroupIndex].match(rawGroupNumberRegex)
                    rawGroupId = await rawGroup[rawGroupIndex].match(rawGroupIdRegex)
                    groupNumber = await rawGroupNumber[0].match(groupNumberRegex)
                    groupId = await rawGroupId[0].match(groupIdRegex)
                    var group = new Object()
                        group.groupNumber = groupNumber[0]
                        group.groupId = groupId[0]
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push(group)
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
                    element.subject = subjectsMatrix[subjectListIndex][subjectIndex]
                    var time = new Object()
                        time.startTime = timeMatrix[subjectListIndex][0]
                        time.finishTime = timeMatrix[subjectListIndex][1]
                    element.time = time
                    element.place = placeMatrix[subjectListIndex][subjectIndex]
                    element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                    element.type = typeSubjectMatrix[subjectListIndex][subjectIndex]
                lectorSchedule[subjectListIndex].push(element)
            }
        })
    })
    //t = transpose(lectorSchedule)
    return JSON.parse(JSON.stringify(lectorSchedule))
}

// async function getGroupId(number){
//     const responseData = await getRequestToSSAU(`https://ssau.ru/rasp`)
//     const rawFacultiesRegex = /class="faculties"><h2((.|\n)*)class="footer"/g
//     const rawFaculties = await responseData.match(rawFacultiesRegex);
//     const rawFacultyNameRegex = /"h3-text"> (.)+ </g
//     const rawFacultyIdRegex = /faculty\/(\d)+\?course/g
//     const facultyIdRegex = /(\d)+/g
//     const rawFacultiyNamesList = rawFaculties[0].match(rawFacultyNameRegex)
//     const rawFacultiyIdList = rawFaculties[0].match(rawFacultyIdRegex)
//     const faculties = []
//     let groupId = -1
//     const courseGroup = []
//     for (let index = 0; index < rawFacultiyNamesList.length; index++){
//         facultyName = rawFacultiyNamesList[index].substring(11). slice(0, -2)
//         facultyId = rawFacultiyIdList[index].match(facultyIdRegex)
//         faculties.push({facultyId: facultyId, facultyName: facultyName})
//     }
//     for (let facultyListIndex = 0; facultyListIndex < faculties.length; facultyListIndex++){
//         const rawCourseRegex = /href="\/rasp\/faculty\/(.)*<\/nav><div/g
//         const facultyCourseData = await getRequestToSSAU(`https://ssau.ru/rasp/faculty/${faculties[facultyListIndex]["facultyId"]}?course=1`)
//         const rawCourse = facultyCourseData.match(rawCourseRegex)
//         if(rawCourse === null) continue
//         const rawCourseNumberRegex = /course=\d/g
//         const rawCourseNumbers = rawCourse[0].match(rawCourseNumberRegex)
//         const courseNumberRegex = /\d/g
//         const maxCourseNumber = parseInt(rawCourseNumbers[0].match(courseNumberRegex))
//         for (let course = 1; course <= maxCourseNumber; course++){
//             const facultyGroupsData = await getRequestToSSAU(`https://ssau.ru/rasp/faculty/${faculties[facultyListIndex]["facultyId"]}?course=${course}`)
//             const rawGroupsRegex = /href="\/rasp\?groupId=(\d)+"(.|\n)*class="footer"/g
//             const rawGroups = facultyGroupsData.match(rawGroupsRegex)
//             groupNumberRegex = /<span>(.)*<\/span>/g
//             groupIdRegex = /groupId=(\d)+"/g
//             const rawGroupNumbers = rawGroups[0].match(groupNumberRegex)
//             const rawGroupIds = rawGroups[0].match(groupIdRegex)
//             const groupNumbers =  []
//             rawGroupNumbers.forEach(element => {
//                 groupNumbers.push(element.substring(6).slice(0, -7))
//             });
//             const groupIds = []
//             rawGroupIds.forEach(element => {
//                 groupIds.push(element.substring(8).slice(0, -1))
//             })
//             groupNumbers.forEach((element, index, groupNumbers) => { courseGroup.push({groupNumber: element, groupId: groupIds[index]})});
//             regexNumber = new RegExp(number)
//             courseGroup.forEach((element) => {
//                 if (regexNumber.test(element["groupNumber"])){
//                     groupId = element["groupId"]
//                 }
//             })
//         }   
//     }
//     return groupId
// }

async function getGroup(){
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
            groupNumbers.forEach((element, index, groupNumbers) => { courseGroup.push({id: groupIds[index], number: element})});
        }   
    }
    return courseGroup
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

            const rawGroupRegex = /href="\/rasp\?groupId=(.)*>/g
            const rawGroupNumberRegex = /schedule__group">(.)* /g
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
                    groupsMatrix[rawSubjectListNumber][rawSubjectIndex].push({"groupNumber":groupNumber[0], "groupId": groupId[0]})
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
        subjectList.forEach((subject, subjectIndex) =>{
            if(subject===null){
                groupSchedule[subjectListIndex].push(null)
            }
            else{
                if(subjectsMatrix[subjectListIndex][subjectIndex].length==1){
                    var element = new Object()
                        element.subject = subjectsMatrix[subjectListIndex][subjectIndex][0]
                        element.time = timeMatrix[subjectListIndex]
                        element.place = placeMatrix[subjectListIndex][subjectIndex][0]
                        element.lector = lectorMatrix[subjectListIndex][0][0]
                        lectorMatrix[subjectListIndex].shift()
                        if(groupsMatrix[subjectListIndex][subjectIndex] !== null){
                            element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                        }
                        else{
                            element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                        }
                        element.type = typeSubjectMatrix[subjectListIndex][subjectIndex][0]
                    groupSchedule[subjectListIndex].push([element])
                }
                else{
                    lessonList = []
                    for (lessonId = 0; lessonId < subjectsMatrix[subjectListIndex][subjectIndex].length; lessonId++){
                        var element = new Object()
                            element.subject = subjectsMatrix[subjectListIndex][subjectIndex][lessonId]
                            element.time = timeMatrix[subjectListIndex]
                            element.place = placeMatrix[subjectListIndex][subjectIndex][lessonId]
                            element.lector = lectorMatrix[subjectListIndex][0][lessonId]
                            if(groupsMatrix[subjectListIndex][subjectIndex] !== null){
                                element.groups = groupsMatrix[subjectListIndex][subjectIndex][0]
                            }
                            else{
                                element.groups = groupsMatrix[subjectListIndex][subjectIndex]
                            }
                            element.type = typeSubjectMatrix[subjectListIndex][subjectIndex][lessonId]
                            lessonList.push(element)
                    }
                    groupSchedule[subjectListIndex].push(lessonList)
                    lectorMatrix[subjectListIndex].shift()
                }
            }
        })
    })
    //t = transpose(groupSchedule)
    return JSON.parse(JSON.stringify(groupSchedule))
}


app.get("/search/:request", async function(req, res){
    console.log(req)
    const { sequelize, Staff, Group } = await getContext()
    const request = req.params.request;
    const like = request+'%'
    const groups = await Group.findAll({where:{number:{[Op.like]: like}}, order: [['number', 'ASC'],], raw: true})
    const staffs = await Staff.findAll({where:{name:{[Op.like]: like}}, order: [['name', 'ASC'],], raw: true })
    sequelize.close()
    res.send({"groups":groups, "staff": staffs});
})

app.get("/groups", async function(req, res){
    console.log(req)
    const { sequelize, Staff, Group } = await getContext()
    const groups = await Group.findAll({raw: true , order: [['number', 'ASC'],]},)
                             .catch(err=>console.log(err));
    sequelize.close()
    res.send(groups);
});

app.get("/groups/:groupId", async function(req, res){
    console.log(req)
    const { sequelize, Staff, Group } = await getContext()
    const groupId = req.params.groupId
    if(isNaN(parseInt(groupId))){
        sequelize.close()
        res.status(404).send('groupId is invalid');
    }
    else{
        currentDate = new Date();
        startDate = new Date(currentDate.getFullYear(), 8, 1);
        var days = Math.floor((currentDate - startDate) /
            (24 * 60 * 60 * 1000));
        var selectedWeek = Math.ceil(days / 7) + 1;
        var selectedWeekday = currentDate.getDay()+1 
        for (const key in req.query) {
            if (key === "selectedWeek"){
                if(!isNaN(req.query[key])){
                    selectedWeek = req.query[key]
                }
            }
            if(key === "selectedWeekday"){
                if(!isNaN(req.query[key])){
                    selectedWeekday = req.query[key]
                }
            }
        }
        const group = await Group.findOne({where:{id: groupId}, raw: true })
                                .catch(err=>console.log(err));
        sequelize.close()
        if (group === null) {
            res.send({groupNumber: "No Group", groupSchedule:null})
        }
        else {
            const data = await getGroupSchedule(groupId, selectedWeek, selectedWeekday)
            res.send({groupNumber: group.number, groupSchedule: data});
        }
    }
});

app.get("/staff", async function(req, res){
    console.log(req)
    const { sequelize, Staff, Group } = await getContext()
    const staff = await Staff.findAll({raw: true })
                             .catch(err=>console.log(err));
    sequelize.close()
    res.send(staff);
});

app.get("/staff/:staffId", async function(req, res){
    console.log(req)
    const { sequelize, Staff, Group } = await getContext()
    const staffId = req.params.staffId
    if(isNaN(parseInt(staffId))){
        sequelize.close()
        res.status(404).send('groupId is invalid');
    }
    else{
        currentDate = new Date();
        startDate = new Date(currentDate.getFullYear(), 8, 1);
        var days = Math.floor((currentDate - startDate) /
            (24 * 60 * 60 * 1000));
        var selectedWeek = Math.ceil(days / 7) + 1;
        var selectedWeekday = currentDate.getDay()+1 
        for (const key in req.query) {
            if (key === "selectedWeek"){
                if(!isNaN(req.query[key])){
                    selectedWeek = req.query[key]
                }
            }
            if(key === "selectedWeekday"){
                if(!isNaN(req.query[key])){
                    selectedWeekday = req.query[key]
                }
            }
        }
        const lecturer = await Staff.findOne({where:{id: staffId}, raw: true })
                                .catch(err=>console.log(err));
        sequelize.close()
        if (lecturer === null) {
            res.send({lecturerName: "No Lecturer", lecturerSchedule: null})
        }
        else {
        const data = await getLecturerSchedule(staffId, selectedWeek, selectedWeekday)
        res.send({lecturerName: lecturer.name, lecturerSchedule: data});
        }
    }
});


app.listen(3001, async function(){
    await createDb()
    const { sequelize, Staff, Group } = await getContext()
    try {
        await sequelize.authenticate()
        console.log('Соединение с БД было успешно установлено')
    } catch (e) {
        console.log('Невозможно выполнить подключение к БД: ', e)
    }
    await sequelize.sync().then(async ()=>{
        const staffList = await getStaff()
        await Staff.bulkCreate(staffList, { validate: true })
        const groupList = await getGroup()
        await Group.bulkCreate(groupList, { validate: true })
    })
    .catch(err=> console.log(err));
    sequelize.close()
    console.log("Сервер ожидает подключения...");
});