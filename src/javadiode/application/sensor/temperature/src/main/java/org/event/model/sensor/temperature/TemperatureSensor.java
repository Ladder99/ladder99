package org.event.model.sensor.temperature;

import org.event.model.GeoLocation;
import org.event.model.sensor.Sensor;
import org.event.model.sensor.SensorEvent;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Random;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
@Service
public class TemperatureSensor extends Sensor {

    private transient double oldTemp = 18.0;
    private transient double maxDev = 5.0;
    private transient Random random = new Random();

    public TemperatureSensor(String type, int id, String targetd, GeoLocation geoLocation) {
        super(type, id, targetd, geoLocation);
    }

    public static double round(double value, int places) {
        if (places < 0) throw new IllegalArgumentException();

        BigDecimal bd = new BigDecimal(value);
        bd = bd.setScale(places, RoundingMode.HALF_UP);
        return bd.doubleValue();
    }

    public SensorEvent generateEvent(int index) {
        TemperatureSensorEvent temperatureSensorEvent = new TemperatureSensorEvent(this, index, round(oldTemp + (random.nextDouble() * maxDev) - (maxDev / 2), 1));
        oldTemp = temperatureSensorEvent.getTemperature();
        return temperatureSensorEvent;
    }
}
