const workHoursModel = require('../models/workHoursModel')

/** consulta que el tenico si tenga un reporte **/
const consult = async (req, res, next) => {
    const tecnico = req.body.idTecnico
    const weekYear = parseInt(req.body.numWeek)

    const data = {
        tecnico,
        weekYear
    };
    console.log(data);
    workHoursModel.find(data)
        .then(report => {
            if (report.length === 0) {
                res.json({
                    message: 'No hay reportes para esta consulta'
                });
                return;
            }
            Promise.all(report.map(async repor => {
                const hoursWorked = validateHours(repor)
                res.json({
                    hoursWorked: hoursWorked
                });
            })).catch(error => console.log(error));
        }).catch(error => console.log(error));
}

/** calcula las horas reportadas por dias **/
const validateHours = (report) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let minuteAccum = 0
    let normalHoursAccum = 0
    let nightHoursAccum = 0
    let sundayHoursAccum = 0
    let normalHours = 0
    let nightHours = 0
    let sundayHours = 0
    let normalExtraHours = 0
    let nightExtraHours = 0
    let sundayExtraHours = 0

    for (const day of report.week) {
        const nameDay = Object.keys(day).shift()
        let indexDay = dayNames.findIndex(
            (element) => element === nameDay
        );
        if (indexDay > 0) {
            for (let i = 0; i < day.timeStart.length; i++) {
                let startHour = day.timeStart[i].split(":");
                let endHour = day.timeEnd[i].split(":");

                if (startHour[0] >= 7 && endHour[0] <= 20) {
                    //calcular horas dia
                    let hour = parseInt(endHour[0]) - parseInt(startHour[0])
                    let minute = parseInt(startHour[1]) + parseInt(endHour[1])
                    normalHoursAccum += nightHoursAccum
                    normalHoursAccum += hour
                    normalHours += hour
                    if (minute < 60 && minute > 0) {
                        normalHoursAccum -= 1
                        minuteAccum = 60 - minute
                    }
                    if (minuteAccum >= 60) {
                        normalHoursAccum += 1
                        minuteAccum = minuteAccum % 60
                    }
                    if (normalHoursAccum > 48) {
                        normalExtraHours += normalHoursAccum % 48
                        normalHoursAccum = 48
                    }
                    if (normalHours > 48) {
                        normalHours = 48
                    }
                }
                else if (startHour[0] > 20 && endHour[0] < 7) {
                    //calcular hora nocturnas
                    let hour = parseInt(endHour[0]) - parseInt(startHour[0])
                    let minute = parseInt(startHour[1]) + parseInt(endHour[1])
                    nightHoursAccum += normalHoursAccum
                    nightHoursAccum += hour
                    nightHours += hour
                    if (minute < 60 && minute > 0) {
                        nightHoursAccum -= 1
                        minuteAccum = 60 - minute
                    }
                    if (minuteAccum > 60) {
                        nightHoursAccum += 1
                        minuteAccum = minuteAccum % 60
                    }
                    if (nightHoursAccum > 48) {
                        nightExtraHours += nightHoursAccum % 48
                        nightHoursAccum = 48
                    }
                    if (nightHours >= 48) {
                        nightHours = 48
                    }
                }
            }

        } else if (indexDay === 0) {
            //calcular horas dominicales
            for (let i = 0; i < day.timeStart.length; i++) {
                let startHour = day.timeStart[i].split(":");
                let endHour = day.timeEnd[i].split(":");
                if (startHour[0] >= 00 && endHour[0] < 24) {
                    let hour = parseInt(endHour[0]) - parseInt(startHour[0])
                    let minute = parseInt(startHour[1]) + parseInt(endHour[1])
                    sundayHoursAccum += (nightHoursAccum + normalHoursAccum)
                    sundayHoursAccum += hour
                    sundayHours += hour
                    if (minute < 60 && minute > 0) {
                        sundayHoursAccum -= 1
                        minuteAccum = 60 - minute
                    }
                    if (minuteAccum > 60) {
                        sundayHoursAccum += 1
                        minuteAccum = minuteAccum % 60
                    }
                    if (sundayHoursAccum > 48) {
                        sundayExtraHours += sundayHoursAccum % 48
                        sundayHoursAccum = 48
                    }
                    if (sundayHours >= 48) {
                        sundayHours = 48
                    }
                }
            }
        }
    }

    return {
        normalHours: normalHours,
        nightHours: nightHours,
        sundayHours: sundayHours,
        normalExtraHours: normalExtraHours,
        nightExtraHours: nightExtraHours,
        sundayExtraHours: sundayExtraHours,
    }
}

module.exports = {
    consult
}