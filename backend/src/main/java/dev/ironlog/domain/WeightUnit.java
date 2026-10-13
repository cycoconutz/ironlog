package dev.ironlog.domain;

public enum WeightUnit {
    KG,
    LB;

    public double toKilograms(double value) {
        return this == LB ? value * 0.45359237 : value;
    }

    public double fromKilograms(double kilograms) {
        return this == LB ? kilograms / 0.45359237 : kilograms;
    }
}
