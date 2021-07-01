package org.event.model;

import org.apache.commons.lang3.builder.ReflectionToStringBuilder;

import java.io.Serializable;
import java.util.Date;
import java.util.UUID;

/**
 * Created by marcelmaatkamp on 15/10/15.
 */
public class Event implements Serializable {

    int index;
    Date date;
    UUID uuid = UUID.randomUUID();

    public Event() {

    }

    public Event(int index, Date date) {
        this.index = index;
        this.date = date;
    }

    public int getIndex() {
        return index;
    }

    public UUID getUuid() {
        return uuid;
    }

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String toString() {
        return new ReflectionToStringBuilder(this).toString();
    }

}
