import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import './Component.css'
import { BarClass } from './Bar';
import { useParams, useSearchParams } from 'react-router-dom';
import './Schedule.css'


function getCurrentDate(){
  var currentDate = new Date();
  var startDate = new Date(currentDate.getFullYear(), 8, 1);
  var days = Math.floor((currentDate - startDate) /
      (24 * 60 * 60 * 1000));
  var currentWeek = Math.ceil(days / 7) + 1;
  var currentWeekday = currentDate.getDay()+1 
  var currentYear = currentDate.getFullYear()
  return {currentWeek: currentWeek, currentWeekday: currentWeekday, currentYear: currentYear}
}

const dateByWeekNumber = (year, week, daysFromMonday) => {
  const currentDate = new Date()
  var date;
  if (currentDate.getMonth()>=0 && currentDate.getMonth() <=6){
    date = new Date(year, 1, 1);
  }
  else{
    date = new Date(year, 8, 1);
  }
  const daysToMonday = date.getDay()
  date.setDate(date.getDate() + (week - 1) * 7 - daysToMonday);
  //date.setDate(date.getDate() - 3);
  date.setDate(date.getDate()+daysFromMonday);
  return `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`;
};

function getTimes(subjectMatrix){
  const timeSet = new Set()
  for (var rowId = 0; rowId < subjectMatrix.length; rowId ++)
  {
    for (var subjectId = 0; subjectId < subjectMatrix[rowId].length; subjectId++)
    {
      if (subjectMatrix[rowId][subjectId] !==null){
        timeSet.add([subjectMatrix[rowId][subjectId]["time"]["startTime"],
                      subjectMatrix[rowId][subjectId]["time"]["finishTime"]])
        break
      }
    }
  }
  const timeList = Array.from(timeSet)
  console.log(timeList)
  return timeList
}

const weekDays = [
                  {number: 1, name:"Понедельник"}, 
                  {number: 2, name:"Вторник"}, 
                  {number: 3, name:"Среда"},
                  {number: 4, name:"Четверг"},
                  {number: 5, name:"Пятница"},
                  {number: 6, name:"Суббота"}
                ]

const convertStringToHTML = htmlString => {
    const parser = new DOMParser();
    const html = parser.parseFromString(htmlString, 'text/html');

    return html.body;
}

function SchedulePage(){
    const parser = new DOMParser();
    const date = getCurrentDate()
    const { id } = useParams()
    const [queryParameters] = useSearchParams()
    const [selectedWeek, setSelectedWeek] = useState(parseInt(queryParameters.get("selectedWeek")))
    const [selectedWeekday, setSelectedWeekday] = useState(parseInt(queryParameters.get("selectedWeekday")))
    const [subjects, setSubjects] = useState([])
    const [times, setTimes] = useState([])
    const [name, setName] = useState("")
    useEffect(() => {
      axios.get(`http://localhost:3001/staff/${parseInt(id)}?selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`).then((response)=>{
        setSubjects(response.data["lecturerSchedule"]) 
        setName(response.data["lecturerName"])
        if(isNaN(selectedWeek)){
          setSelectedWeek(date["currentWeek"])
        }
        if (isNaN(selectedWeekday)){
          setSelectedWeekday(date["currentWeekday"])
        }
        if(Array.isArray(response.data["lecturerSchedule"])){
          setTimes(getTimes(response.data["lecturerSchedule"]))
        }
      })
    }, [])
    

    return (
      <>
      <div class="container">
        <BarClass />
      </div>
      {Array.isArray(subjects)&&
        <>
        <div class="container">
            <div class="row blockquote text-center">
                <h2 class="col">{name}</h2>
            </div>
        </div>
        <div class="container-fluid">
            <div class="row">
                <div class="col-sm d-flex justify-content-end"><h6 class="col-sm d-inline-flex p-2 Лекция">Лекция</h6></div>
                <div class="col-sm d-flex justify-content-end"><h6 class="col-sm d-inline-flex p-2 Практика">Практика</h6></div>
                <div class="col-sm d-flex justify-content-end"><h6 class="col-sm d-inline-flex p-2 Лабораторная">Лабораторная</h6></div>
                <div class="col-sm d-flex justify-content-end"><h6 class="col-sm d-inline-flex p-2 Другое">Другое</h6></div>
            </div>
        </div>
        <div class="container-fluid">
          <div class="row">
            <div class="col-sm d-flex justify-content-start">
              <a href={`\\staff\\${parseInt(id)}?selectedWeek=${parseInt(selectedWeek)-1}&selectedWeekday=${selectedWeekday}`} class="btn btn-link btn-lg active" role="button" aria-pressed="true" onChange={()=>setSelectedWeek(selectedWeek-1)}><span aria-hidden="true">&laquo;Предыдущая неделя</span></a>
            </div>
            <div class="col-sm d-flex justify-content-center">
              <h3>Неделя: {selectedWeek}</h3>
            </div>
            <div class="col-sm d-flex justify-content-end">
              <a href={`\\staff\\${parseInt(id)}?selectedWeek=${parseInt(selectedWeek)+1}&selectedWeekday=${selectedWeekday}`} class="btn btn-link btn-lg active" role="button" aria-pressed="true" onChange={()=>setSelectedWeek(selectedWeek+1)}><span aria-hidden="true">Следующая неделя&raquo;</span></a>
            </div>
          </div>
        </div>
        <div class="container">
          <table class="table table-bordered">
            <thead>
              <tr>
              <th scope="col"></th>
                {
                  weekDays.map((weekDay) => {
                    return <th scope="col blockquote text-center">
                            {`${weekDay["name"]}\n${dateByWeekNumber(date["currentYear"], selectedWeek, weekDay["number"])}`}
                            </th>
                  })
                }
              </tr>
            </thead>
            <tbody>
              {
                subjects.map((row, rowId, arr) => {
                    return (
                          <tr>
                          <th scope="col">{times[rowId][0]}-{times[rowId][1]}</th>
                          {row.map((lesson) => {
                            if(lesson === null){
                              return <td>
                                      <div class="container-fluid">
                                        <div class="col-sm">
                                        </div>
                                      </div>
                                      </td>
                            }
                            else{
                              return <td>
                                <div class="container-fluid">
                                  <div class="row-sm">
                                        <div class={lesson["type"]}>
                                        <p><u>{convertStringToHTML(lesson["subject"])}</u></p>
                                        <p><small>{lesson["place"]}</small></p>
                                        {lesson["groups"] !== null && 
                                            lesson["groups"].map((group)=>{
                                            return <p><a href={`\\groups\\${group["groupId"]}`} class="btn btn-link" role="button" aria-pressed="true"><small>{group["groupNumber"]}</small></a></p>
                                            })
                                        }
                                    </div>
                                  </div>
                                </div>
                              </td>
                            }
                          })}
                          </tr>)
                  })
              }
            </tbody>
          </table>
        </div>
        </>
      }
      {!Array.isArray(subjects) &&
        <h1>Расписание не введено!</h1>
      }
      </>
    );
}


export class StaffSchedule extends React.Component {
  render(){
    return (
        <div class="container">
          <SchedulePage />
        </div>
    );
  }
}
