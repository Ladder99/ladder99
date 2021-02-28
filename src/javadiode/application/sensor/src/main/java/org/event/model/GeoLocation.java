package org.event.model;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;

import java.io.Serializable;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
public class GeoLocation implements Serializable {

    private double longitude;
    private double latitude;

    public GeoLocation() {

    }

    public GeoLocation(double latitude, double longitude) {
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public String toString() {
        return new ReflectionToStringBuilder(this).toString();
    }

}
