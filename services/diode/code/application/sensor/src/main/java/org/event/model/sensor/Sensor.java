package org.event.model.sensor;

import org.event.model.GeoLocation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.Serializable;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
@Service
public class Sensor implements Serializable {
    private static final Logger log = LoggerFactory.getLogger(Sensor.class);

    String type;
    int id;

    GeoLocation geoLocation;
    String targetid;

    public Sensor(String type, int id, String targetid, GeoLocation geoLocation) {
        this.type = type;
        this.id = id;
        this.geoLocation = geoLocation;
        this.targetid = targetid;
    }

    public Sensor() {

    }

    public String getTargetid() {
        return targetid;
    }

    public void setTargetid(String targetid) {
        this.targetid = targetid;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public SensorEvent generateEvent(int index) {
        SensorEvent sensorEvent = new SensorEvent(this, index);
        return sensorEvent;
    }

    public GeoLocation getGeoLocation() {
        return geoLocation;
    }

    public void setGeoLocation(GeoLocation geoLocation) {
        this.geoLocation = geoLocation;
    }
}
