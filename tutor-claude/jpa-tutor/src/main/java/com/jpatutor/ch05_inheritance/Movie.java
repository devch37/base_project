package com.jpatutor.ch05_inheritance;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("MOVIE")
@Getter
@NoArgsConstructor
public class Movie extends Item {

    private String director;

    public Movie(String name, BigDecimal price, String director) {
        super(name, price);
        this.director = director;
    }
}
