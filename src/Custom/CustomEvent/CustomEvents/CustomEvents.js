import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { View, TouchableWithoutFeedback } from 'react-native';
import moment from 'moment';
import memoizeOne from 'memoize-one';

import CustomEvent from '../../CustomEvent/CustomEvent/CustomEvent';
import {
  CONTAINER_HEIGHT,
  CONTAINER_WIDTH,
  calculateDaysArray,
  DATE_STR_FORMAT,
  availableNumberOfDays,
  minutesToYDimension,
  CONTENT_OFFSET,
  getTimeLabelHeight,
  calculateColumnsDataArray
} from '../../../utils';

import styles from '../../CustomEvent/CustomEvents/CustomEvents.styles';

const MINUTES_IN_HOUR = 60;
const EVENT_HORIZONTAL_PADDING = 15;
const EVENTS_CONTAINER_WIDTH = CONTAINER_WIDTH - EVENT_HORIZONTAL_PADDING;
const MIN_ITEM_WIDTH = 4;
const ALLOW_OVERLAP_SECONDS = 2;

const areEventsOverlapped = (event1EndDate, event2StartDate) => {
  const endDate = moment(event1EndDate);
  endDate.subtract(ALLOW_OVERLAP_SECONDS, 'seconds');
  return endDate.isSameOrAfter(event2StartDate);
};

const getStyleForEvent = (event, regularItemWidth, hoursInDisplay, timeToTime) => {
  const {from, to} = timeToTime
  const startDate = moment(event.startDate).add(-from, 'h');
  const startHours = startDate.hours();
  const startMinutes = startDate.minutes();
  const totalStartMinutes = startHours * MINUTES_IN_HOUR + startMinutes;
  const top = minutesToYDimension(hoursInDisplay, totalStartMinutes);
  const deltaMinutes = moment(event.endDate).diff(event.startDate, 'minutes');
  const height = minutesToYDimension(hoursInDisplay, deltaMinutes);

  return {
    top: top + CONTENT_OFFSET,
    left: 0,
    height,
    width: regularItemWidth,
  };
};

const addOverlappedToArray = (baseArr, overlappedArr, itemWidth) => {
  // Given an array of overlapped events (with style), modifies their style to overlap them
  // and adds them to a (base) array of events.
  if (!overlappedArr) return;

  const nOverlapped = overlappedArr.length;
  if (nOverlapped === 0) {
    return;
  }
  if (nOverlapped === 1) {
    baseArr.push(overlappedArr[0]);
    return;
  }

  let nLanes;
  let horizontalPadding;
  let indexToLane;
  if (nOverlapped === 2) {
    nLanes = nOverlapped;
    horizontalPadding = 3;
    indexToLane = (index) => index;
  } else {
    // Distribute events in multiple lanes
    const maxLanes = nOverlapped;
    const latestByLane = {};
    const laneByEvent = {};
    overlappedArr.forEach((event, index) => {
      for (let lane = 0; lane < maxLanes; lane += 1) {
        const lastEvtInLaneIndex = latestByLane[lane];
        const lastEvtInLane =
          (lastEvtInLaneIndex || lastEvtInLaneIndex === 0) &&
          overlappedArr[lastEvtInLaneIndex];
        if (
          !lastEvtInLane ||
          !areEventsOverlapped(
            lastEvtInLane.data.endDate,
            event.data.startDate,
          )
        ) {
          // Place in this lane
          latestByLane[lane] = index;
          laneByEvent[index] = lane;
          break;
        }
      }
    });

    nLanes = Object.keys(latestByLane).length;
    horizontalPadding = 2;
    indexToLane = (index) => laneByEvent[index];
  }
  const dividedWidth = itemWidth / nLanes;
  const width = Math.max(dividedWidth - horizontalPadding, MIN_ITEM_WIDTH);

  overlappedArr.forEach((eventWithStyle, index) => {
    const { data, style } = eventWithStyle;
    baseArr.push({
      data,
      style: {
        ...style,
        width,
        left: dividedWidth * indexToLane(index),
      },
    });
  });
};


const getEventsWithPosition = (totalEvents, regularItemWidth, hoursInDisplay, timeToTime) => {
  return totalEvents.map((events) => {
    let overlappedSoFar = []; // Store events overlapped until now
    let lastDate = null;
    const eventsWithStyle = events.reduce((eventsAcc, event) => {
      const style = getStyleForEvent(event, regularItemWidth, hoursInDisplay, timeToTime);
      const eventWithStyle = {
        data: event,
        style,
      };

      if (!lastDate || areEventsOverlapped(lastDate, event.startDate)) {
        overlappedSoFar.push(eventWithStyle);
        const endDate = moment(event.endDate);
        lastDate = lastDate ? moment.max(endDate, lastDate) : endDate;
      } else {
        addOverlappedToArray(
          eventsAcc,
          overlappedSoFar,
          regularItemWidth,
        );
        overlappedSoFar = [eventWithStyle];
        lastDate = moment(event.endDate);
      }
      return eventsAcc;
    }, []);
    addOverlappedToArray(
      eventsWithStyle,
      overlappedSoFar,
      regularItemWidth,
    );
    return eventsWithStyle;
  });
};

class CustomEvents extends PureComponent {
  yToHour = (y) => {
    const { hoursInDisplay } = this.props;
    const hour = ((y * hoursInDisplay ) / CONTAINER_HEIGHT);
    return hour;
  };

  getEventItemWidth = (padded = true) => {
    const { numberOfDays } = this.props;
    const fullWidth = padded ? EVENTS_CONTAINER_WIDTH : CONTAINER_WIDTH;
    return fullWidth / numberOfDays;
  };

  processEvents = memoizeOne(
    (eventsByDate, initialDate, numberOfDays, hoursInDisplay, rightToLeft, timeToTime, horizontalData) => {
      // totalEvents stores events in each day of numberOfDays
      // example: [[event1, event2], [event3, event4], [event5]], each child array
      // is events for specific day in range
      const dates = calculateDaysArray(initialDate, numberOfDays, rightToLeft);
      const tech = calculateColumnsDataArray(horizontalData, numberOfDays, initialDate)
      // console.log(tech)
      // const totalEvents = dates.map((date) => {
      //   const dateStr = date.format(DATE_STR_FORMAT);
      //   return eventsByDate[dateStr] || [];
      // });
      // console.log(totalEvents)
      const totalEventsCustom = tech.map((item) => {
        const EmployeeID = item?.EmployeeID.toString()
        // console.log(EmployeeID)
        return eventsByDate[EmployeeID] || [];
      });
      // console.log(eventsByDate)
      // console.log(totalEventsCustom)

      const regularItemWidth = this.getEventItemWidth();

      // const totalEventsWithPosition = getEventsWithPosition(
      //   totalEvents,
      //   regularItemWidth,
      //   hoursInDisplay,
      //   timeToTime
      // );
      const totalEventsWithPosition = getEventsWithPosition(
        totalEventsCustom,
        regularItemWidth,
        hoursInDisplay,
        timeToTime
      );
      // console.log(totalEventsWithPosition)
      return totalEventsWithPosition;
    },
  );

  onGridTouch = (event, dayIndex, longPress) => {
    const { initialDate, onGridClick, onGridLongPress } = this.props;
    const callback = longPress ? onGridLongPress : onGridClick;
    if (!callback) {
      return;
    }
    const { locationY } = event.nativeEvent;

    // WithDec === with decimals. // e.g. hours 10.5 === 10:30am
    const hoursWDec = this.yToHour(locationY - CONTENT_OFFSET);
    const minutesWDec = (hoursWDec - parseInt(hoursWDec)) * 60;
    const seconds = Math.floor((minutesWDec - parseInt(minutesWDec)) * 60);

    const hour = Math.floor(hoursWDec) + this.props.timeToTime.from;
    const minutes = Math.floor(minutesWDec);

    const date = moment(initialDate)
      .add(dayIndex, 'day')
      .hours(hour)
      .minutes(minutes)
      .seconds(seconds)
      .toDate();

    callback(event, hour, date);
  };

  onDragEvent = (event, newX, newY) => {
    const { onDragEvent, horizontalData } = this.props;
    if (!onDragEvent) {
      return;
    }

    const movedTech = Math.floor(newX / this.getEventItemWidth());
    const index = horizontalData.findIndex(i => i.EmployeeID === event.EmployeeID)
    const newTech = horizontalData[index + movedTech]

    const startTime = event.startDate.getTime();
    const newStartDate = new Date(startTime);

    let newMinutes = this.yToHour(newY - CONTENT_OFFSET) * 60;
    const newHour = Math.floor(newMinutes / 60);
    newMinutes %= 60;
    newStartDate.setHours(newHour, newMinutes);

    const newEndDate = new Date(
      newStartDate.getTime() + event?.originalDuration,
    );

    // onDragEvent(event, newStartDate, newEndDate);
    onDragEvent(event, newStartDate, newEndDate, newTech);
  };

  isToday = (dayIndex) => {
    const { initialDate } = this.props;
    const today = moment();
    return moment(initialDate).add(dayIndex, 'days').isSame(today, 'day');
  };

  render() {
    const {
      eventsByDate,
      initialDate,
      numberOfDays,
      times,
      onEventPress,
      onEventLongPress,
      eventContainerStyle,
      gridRowStyle,
      gridColumnStyle,
      EventComponent,
      rightToLeft,
      hoursInDisplay,
      timeStep,
      onDragEvent,
      timeToTime,
      horizontalData
    } = this.props;
    const totalEvents = this.processEvents(
      eventsByDate,
      initialDate,
      numberOfDays,
      hoursInDisplay,
      rightToLeft,
      timeToTime,
      horizontalData,
    );
    const timeSlotHeight = getTimeLabelHeight(hoursInDisplay, timeStep);

    return (
      <View style={styles.container}>
        {times.map((time, index) => (
          <View
            key={index}
            style={[
              styles.timeRow,
              { height: timeSlotHeight },
              gridRowStyle,
            ]}
          />
        ))}
        <View style={styles.eventsContainer}>
          {totalEvents.map((eventsInSection, dayIndex) => (
            <TouchableWithoutFeedback
              onPress={(e) => this.onGridTouch(e, dayIndex, false)}
              onLongPress={(e) => this.onGridTouch(e, dayIndex, true)}
              key={dayIndex}
            >
              <View style={[styles.eventsColumn, gridColumnStyle]}>
                {eventsInSection.map((item, index) => (
                  <CustomEvent
                    key={index}
                    event={item.data}
                    position={item.style}
                    onPress={onEventPress}
                    onLongPress={onEventLongPress}
                    EventComponent={EventComponent}
                    containerStyle={eventContainerStyle}
                    onDrag={onDragEvent && this.onDragEvent}
                    hoursInDisplay={hoursInDisplay}
                    timeToTime={timeToTime}
                  />
                ))}
              </View>
            </TouchableWithoutFeedback>
          ))}
        </View>
      </View>
    );
  }
}

const GridRowPropType = PropTypes.shape({
  borderColor: PropTypes.string,
  borderTopWidth: PropTypes.number,
});

const GridColumnPropType = PropTypes.shape({
  borderColor: PropTypes.string,
  borderLeftWidth: PropTypes.number,
});


CustomEvents.propTypes = {
  numberOfDays: PropTypes.oneOf(availableNumberOfDays).isRequired,
  eventsByDate: PropTypes.objectOf(PropTypes.arrayOf(CustomEvent.propTypes.event))
    .isRequired,
  initialDate: PropTypes.string.isRequired,
  hoursInDisplay: PropTypes.number.isRequired,
  timeStep: PropTypes.number.isRequired,
  times: PropTypes.arrayOf(PropTypes.string).isRequired,
  onEventPress: PropTypes.func,
  onEventLongPress: PropTypes.func,
  onGridClick: PropTypes.func,
  onGridLongPress: PropTypes.func,
  eventContainerStyle: PropTypes.object,
  gridRowStyle: GridRowPropType,
  gridColumnStyle: GridColumnPropType,
  EventComponent: PropTypes.elementType,
  rightToLeft: PropTypes.bool,
  showNowLine: PropTypes.bool,
  nowLineColor: PropTypes.string,
  onDragEvent: PropTypes.func,
  timeToTime: PropTypes.object
};

export default CustomEvents;
