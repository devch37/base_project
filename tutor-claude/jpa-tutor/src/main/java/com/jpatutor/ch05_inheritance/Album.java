package com.jpatutor.ch05_inheritance;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@DiscriminatorValue("ALBUM") // dtype 컬럼에 'ALBUM' 문자열로 저장된다.
@Getter
@NoArgsConstructor
public class Album extends Item {

    private String artist;

    public Album(String name, BigDecimal price, String artist) {
        super(name, price);
        this.artist = artist;
    }
}
