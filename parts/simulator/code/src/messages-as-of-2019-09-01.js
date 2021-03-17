    "addresses": [
        {
            "keys": ["%I0.0", "IN1", "printer.ribbon_low", "J2.1", "SX1.P0"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.1", "IN2", "printer.service_required", "J2.2", "SX1.P1"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.2", "IN3", "printer.print_end", "J2.3", "SX1.P2"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.3", "IN4", "printer.media_out", "J2.4", "SX1.P3"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.4", "IN5", "printer.ribbon_out", "J2.P5", "SX1.P4"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.5", "IN6", "printer.data_ready", "J2.P6", "SX1.P5"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.6", "IN7", "product.sensor_one", "J1.12", "SX1.P6"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.7", "IN8", "tamp.head_up", "J1.11", "SX1.P7"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.8", "IN9", "web.media_low", "J1.10", "SX1.P8"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.9", "IN10", "tamp.smart_tamp", "J1.9", "SX1.P9"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.10", "IN11", "safety.e_stop", "J3.P12", "SX1.P10"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.11", "IN12", "product.sensor_aux", "J1.8", "SX1.P11"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.12", "IN13"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.13", "IN14"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.14", "IN15", "SX1.P14"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%I0.15", "IN16", "SX1.P15"],
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.0", "OUT1", "printer.start_print", "J2.7", "SX2.P0"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.1", "OUT2", "printer.feed", "J2.8", "SX2.P1"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.2", "OUT3", "printer.pause", "J2.9", "SX2.P2"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.3", "OUT4", "printer.reprint", "J2.10", "SX2.P3"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.4", "OUT5", "tamp.cylinder", "J6.1", "SX2.P4"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.5", "OUT6", "tamp.vacuum", "J6.2", "SX2.P5"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.6", "OUT7", "tamp.air_assist", "J6.3", "SX2.P6"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.7", "OUT8", "J6.4", "SX2.P7", "J6.spare1"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.8", "OUT9", "J6.5", "SX2.P8", "J6.spare2"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.9", "OUT10", "andon.green", "J3.P7", "SX2.P9"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.10", "OUT11", "andon.yellow", "J3.P8", "SX2.P10"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.11", "OUT12", "andon.red", "J3.P9", "SX2.P11"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.12", "OUT13", "SX2.P12"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.13", "OUT14", "SX2.P13"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.14", "OUT15", "SX2.P14"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },
        {
            "keys": ["%Q0.15", "OUT16", "SX2.P15"],
            "remote_allow": false,
            "default": 0,
            "constrain": {
                "type": "choice",
                "value": [0, 1]
            }
        },