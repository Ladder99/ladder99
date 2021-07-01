package org.event.model.sensor;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.event.model.Event;

import java.io.Serializable;
import java.util.Date;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
public class SensorEvent extends Event implements Serializable {

    Sensor sensor;

    public SensorEvent() {
        super();
    }

    public SensorEvent(int index) {
        super(index, new Date());
    }

    public SensorEvent(Sensor sensor, int index) {
        super(index, new Date());
        this.sensor = sensor;
    }

    public Sensor getSensor() {
        return sensor;
    }

    public void setSensor(Sensor sensor) {
        this.sensor = sensor;
    }

    public String toString() {
        return new ReflectionToStringBuilder(this).toString();
    }
}
