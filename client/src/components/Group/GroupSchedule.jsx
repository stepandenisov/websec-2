import axios from 'axios'
import { useEffect, useState } from 'react'
import React from 'react';
import '../Style/Component.css'
import { BarClass } from '../Service/Bar';
import { useParams, useSearchParams } from 'react-router-dom';
import '../Style/Schedule.css'
import { Markup } from 'interweave';
import {LoadSpinner} from '../Service/Spinner';


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
  const date = new Date(year, 8, 1);
  const daysToMonday = date.getDay()
  date.setDate(date.getDate() + (week - 1) * 7 - daysToMonday);
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
        timeSet.add([subjectMatrix[rowId][subjectId][0]["time"]["startTime"],
                      subjectMatrix[rowId][subjectId][0]["time"]["finishTime"]])
        break
      }
    }
  }
  const timeList = Array.from(timeSet)
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

function SchedulePage(){
    const date = getCurrentDate()
    var { id} = useParams()
    const [queryParameters] = useSearchParams()
    const [selectedWeek, setSelectedWeek] = useState(parseInt(queryParameters.get("selectedWeek")))
    const [selectedWeekday, setSelectedWeekday] = useState(parseInt(queryParameters.get("selectedWeekday")))
    const [subjects, setSubjects] = useState([])
    const [times, setTimes] = useState([])
    const [number, setNumber] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      axios.get(`http://localhost:3001/groups/${parseInt(id)}?selectedWeek=${selectedWeek}&selectedWeekday=${selectedWeekday}`).then((response)=>{
        setSubjects(response.data["groupSchedule"])
        setNumber(response.data["groupNumber"])
        if(isNaN(selectedWeek)){
          setSelectedWeek(date["currentWeek"])
        }
        if (isNaN(selectedWeekday)){
          setSelectedWeekday(date["currentWeekday"])
        }
        if(Array.isArray(response.data["groupSchedule"])){
          setTimes(getTimes(response.data["groupSchedule"]))
        }
      })
    }, [])
    

    return (
    <>
      {!isLoading &&
        <>
          <div className="container">
            <BarClass />
          </div>
          {Array.isArray(subjects)&&
            <>
              <div className="container">
                  <div className="row blockquote text-center">
                      <h2 className="col">{number}</h2>
                  </div>
              </div>
              <div className="container-fluid">
                  <div className="row">
                      <div className="col-sm d-flex justify-content-end"><h6 className="col-sm d-inline-flex p-2 Лекция">Лекция</h6></div>
                      <div className="col-sm d-flex justify-content-end"><h6 className="col-sm d-inline-flex p-2 Практика">Практика</h6></div>
                      <div className="col-sm d-flex justify-content-end"><h6 className="col-sm d-inline-flex p-2 Лабораторная">Лабораторная</h6></div>
                      <div className="col-sm d-flex justify-content-end"><h6 className="col-sm d-inline-flex p-2 Другое">Другое</h6></div>
                  </div>
              </div>
              <div className="container-fluid">
                <div className="row">
                  <div className="col-sm d-flex justify-content-start">
                    <a href={`\\groups\\${parseInt(id)}?selectedWeek=${parseInt(selectedWeek)-1}&selectedWeekday=${selectedWeekday}`} className="btn btn-link btn-lg active" role="button" aria-pressed="true" onChange={()=>setSelectedWeek(selectedWeek-1)}><span aria-hidden="true">&laquo;Предыдущая неделя</span></a>
                  </div>
                  <div className="col-sm d-flex justify-content-center">
                    <h3>Неделя: {selectedWeek}</h3>
                  </div>
                  <div className="col-sm d-flex justify-content-end">
                    <a href={`\\groups\\${parseInt(id)}?selectedWeek=${parseInt(selectedWeek)+1}&selectedWeekday=${selectedWeekday}`} className="btn btn-link btn-lg active" role="button" aria-pressed="true" onChange={()=>setSelectedWeek(selectedWeek+1)}><span aria-hidden="true">Следующая неделя&raquo;</span></a>
                  </div>
                </div>
              </div>
              <div className="container">
                <table className="table table-bordered">
                  <thead>
                    <tr>
                    <th scope="col"></th>
                      {
                        weekDays.map((weekDay) => {
                          return <th scope="col">
                                  <p className="blockquote-sm text-center">{weekDay["name"]}</p>
                                  <p className="blockquote-sm text-center">{dateByWeekNumber(date["currentYear"], selectedWeek, weekDay["number"])}</p>
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
                                            <div className="container-fluid">
                                              <div className="col-sm">
                                              </div>
                                            </div>
                                            </td>
                                  }
                                  else{
                                    return <td>
                                      <div className="container-fluid">
                                        <div className="row-sm">
                                          {lesson.map((subLesson) => {
                                            return(
                                              <div className="row">
                                                <div className={subLesson["type"]}>
                                                  <p><u>{subLesson["subject"]}</u></p>
                                                  <p><small><Markup content={subLesson["place"]}/></small></p>
                                                  {subLesson["lector"]["lectorId"] !==-1 ?
                                                    <p><em><a href={`\\staff\\${subLesson["lector"]["lectorId"]}`} className="btn btn-link" role="button" aria-pressed="true"><small>{subLesson["lector"]["lectorName"]}</small></a></em></p>
                                                    :<p><em>{subLesson["lector"]["lectorName"]}</em></p>
                                                  }
                                                  {subLesson["groups"] !== null && 
                                                    subLesson["groups"].map((group)=>{
                                                    return <p><a key={group.id} href={`\\groups\\${group["groupId"]}`} className="btn btn-link" role="button" aria-pressed="true"><small>{group["groupNumber"]}</small></a></p>
                                                    })
                                                  }
                                                  {"subGroup" in subLesson["lector"] && 
                                                    <p><small>Подгруппа: {subLesson["lector"]["subGroup"]}</small></p>
                                                  }
                                                </div>
                                              </div>
                                            )
                                          }
                                          )
                                          }
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
      }
      {isLoading && 
      <>  
        <div className="container">
            <BarClass />
        </div>
        <LoadSpinner />
      </>
      }
      </>
    );
}


export class GroupSchedule extends React.Component {
  render(){
    return (
        <div className="container">
          <SchedulePage />
        </div>
    );
  }
}
