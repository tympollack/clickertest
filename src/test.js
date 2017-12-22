$(function() {
    function roundTo(n, digits) {
        var multiplier;
        var negative = false;
        if (isNullUndefined(digits)) {
            digits = 0;
        }
        if (n < 0) {
            negative = true;
            n *= -1;
        }
        multiplier = Math.pow(10, digits);
        n = parseFloat((n * multiplier).toFixed(11));
        n = (Math.round(n) / multiplier).toFixed(2);
        if (negative) {    
            n = (n * -1).toFixed(2);
        }
        return n;
    }
    
    function isNullUndefined(val) {
        return val === undefined || val === null;
    }
    
    function getSavedValue(key) {
        var val = localStorage[key];
        return isNullUndefined(val) ? null : JSON.parse(val);
    }
    
    var timer = null;
    
    var STORAGE_KEY = {
        PLANET_TILES: 'planetTiles',
        PLANET_RESOURCES: 'planetResources',
        PLAYER_RESOURCES: 'playerResources',
        PLAYER_OBJECTS: 'playerObjects'
    };
    
    var planetary_tiles = getSavedValue(STORAGE_KEY.PLANET_TILES) || {
        total: 123000000000, // 123 b acres
        water: 86000000000, // 86 b acres
        pollution: 0,
        waste: 0,
        logistics: 0,
        buildings: 0
    };
    
    var planetary_resources = getSavedValue(STORAGE_KEY.PLANET_RESOURCES) || {
        wood:    14500000000,
        coal:       24600000,
        iron:     6930000000,
        copper:      7380000,
        stone:    6890000000,
        oil:        76800000,
        uranium:      332000
    };
    
    var player_resources = getSavedValue(STORAGE_KEY.PLAYER_RESOURCES) || {
        wood: 0,
        coal: 0,
        iron: 0,
        copper: 0,
        stone: 0
    };
    
    var nonAccumulativeResources = getSavedValue(STORAGE_KEY.NONACC_RESOURCES) || {
        electricity: 0,
        robotSpace: 0
    };
    
    var building_objects = {
        pickaxe: {
            name: 'Pickaxe',
            verb: 'Harvest',
            amount: 1,
            efficiency: 1,
            produces: {},
            cost: {
                wood: 1,
                iron: 1
            },
            drain: {},
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            group: 'manualObject'
        },
        handProcessor: {
            name: 'Hand Unit Processor',
            verb: 'Harvest',
            amount: 0,
            efficiency: 1,
            produces: {
                cog: 0,
                pipe: 0,
                wire: 0,
                rod: 0,
                greenChip: 0
            },
            cost: {
                ironPlate: 15,
                copperPlate: 15
            },
            drain: {},
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            group: 'manualObject'
        },
        woodChipper: {
            name: 'Wood Chipper',
            verb: 'Cut wood',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                wood: 1
            },
            cost: {
                ironPlate: 1,
                cog: 3,
                wire: 2
            },
            drain: {
                coal: .1
            },
            size: {
                length: 1,
                width: 1,
                logistics: 1
            },
            waste: .1,
            pollution: 1,
            group: 'misc'
        },
        storageCrateWood: {
            name: 'Storage Crate - Wood',
            verb: 'store',
            period: 0,
            amount: 1,
            efficiency: 1,
            produces: {},
            cost: {
                wood: 8
            },
            drain: {},
            size: {
                length: 1,
                width: 1,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'misc'
        },
        storageCrateIron: {
            name: 'Storage Crate - Iron',
            verb: 'store',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {},
            cost: {
                ironPlate: 8
            },
            drain: {},
            size: {
                length: 1,
                width: 1,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'misc'
        },
        storageCrateSteel: {
            name: 'Storage Crate - Steel',
            verb: 'store',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {},
            cost: {
                steel: 8
            },
            drain: {},
            size: {
                length: 1,
                width: 1,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'misc'
        },
        coalDrillCoal: {
            name: 'Coal-powered Drill',
            verb: 'Harvest coal',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                coal: 1
            },
            cost: {
                ironPlate: 10,
                stone: 5
            },
            drain: {
                coal: .1
            },
            size: {
                length: 2,
                width: 2,
                logistics: 2
            },
            waste: 1,
            pollution: 10,
            group: 'coalDril'
        },
        coalDrillIron: {
            name: 'Coal-powered Drill',
            verb: 'Harvest iron',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                iron: 1
            },
            cost: {
                ironPlate: 10,
                stone: 5
            },
            drain: {
                coal: .1
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 10,
            group: 'coalDril'
        },
        coalDrillCopper: {
            name: 'Coal-powered Drill',
            verb: 'Harvest copper',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                copper: 1
            },
            cost: {
                ironPlate: 10,
                stone: 5
            },
            drain: {
                coal: .1
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 10,
            group: 'coalDril'
        },
        coalDrillStone: {
            name: 'Coal-powered Drill',
            verb: 'Harvest stone',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                stone: 1
            },
            cost: {
                ironPlate: 10,
                stone: 5
            },
            drain: {
                coal: .1
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 10,
            group: 'coalDril'
        },
        electricDrillCoal: {
            name: 'Electric Drill',
            verb: 'Harvest coal faster',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                coal: 5
            },
            cost: {
                ironPlate: 250,
                cog: 125,
                greenChip: 50
            },
            drain: {
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 2,
            pollution: 5,
            group: 'electricDril'
        },
        electricDrillIron: {
            name: 'Electric Drill',
            verb: 'Harvest iron faster',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                iron: 5
            },
            cost: {
                ironPlate: 250,
                cog: 125,
                greenChip: 50
            },
            drain: {
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 2,
            pollution: 5,
            group: 'electricDril'
        },
        electricDrillCopper: {
            name: 'Electric Drill',
            verb: 'Harvest copper faster',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                copper: 5
            },
            cost: {
                ironPlate: 250,
                cog: 125,
                greenChip: 50
            },
            drain: {
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 2,
            pollution: 5,
            group: 'electricDril'
        },
        electricDrillStone: {
            name: 'Electric Drill',
            verb: 'Harvest stone faster',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                stone: 5
            },
            cost: {
                ironPlate: 250,
                cog: 125,
                greenChip: 50
            },
            drain: {
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 2,
            pollution: 5,
            group: 'electricDril'
        },
        miningRobotCoal: {
            name: 'Mining Robot - Coal',
            verb: 'harvest',
            period: 10,
            amount: 0,
            efficiency: 1,
            produces: {
                coal: 35
            },
            cost: {
                robotBody: 1,
                greenChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: .25,
            pollution: 1,
            group: 'miningRobotics'
        },
        miningRobotIron: {
            name: 'Mining Robot - Iron',
            verb: 'harvest',
            period: 10,
            amount: 0,
            efficiency: 1,
            produces: {
                iron: 35
            },
            cost: {
                robotBody: 1,
                greenChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: .25,
            pollution: 1,
            group: 'miningRobotics'
        },
        miningRobotCopper: {
            name: 'Mining Robot - Copper',
            verb: 'harvest',
            period: 10,
            amount: 0,
            efficiency: 1,
            produces: {
                copper: 35
            },
            cost: {
                robotBody: 1,
                greenChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: .25,
            pollution: 1,
            group: 'miningRobotics'
        },
        miningRobotStone: {
            name: 'Mining Robot - Stone',
            verb: 'harvest',
            period: 10,
            amount: 0,
            efficiency: 1,
            produces: {
                stone: 35
            },
            cost: {
                robotBody: 1,
                greenChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: .25,
            pollution: 1,
            group: 'miningRobotics'
        },
        miningRobotUranium: {
            name: 'Mining Robot - Uranium',
            verb: 'harvest',
            period: 10,
            amount: 0,
            efficiency: 1,
            produces: {
                uranium: 35
            },
            cost: {
                robotBody: 1,
                greenChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: .25,
            pollution: 1,
            group: 'miningRobotics'
        },
        smelterIron: {
            name: 'Iron Smelter',
            verb: 'smelt',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                ironPlate: 1
            },
            cost: {
                stone: 5
            },
            drain: {
                iron: 1,
                coal: .2
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 20,
            group: 'smelter'
        },
        smelterCopper: {
            name: 'Copper Smelter',
            verb: 'smelt',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                copperPlate: 1
            },
            cost: {
                stone: 5
            },
            drain: {
                coal: .2,
                copper: 1
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 20,
            group: 'smelter'
        },
        smelterStone: {
            name: 'Stone Smelter',
            verb: 'smelt',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                brick: 1
            },
            cost: {
                stone: 5
            },
            drain: {
                coal: .2,
                stone: 2
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 20,
            group: 'smelter'
        },
        smelterSteel: {
            name: 'Steel Smelter',
            verb: 'smelt',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                steel: 1
            },
            cost: {
                stone: 5
            },
            drain: {
                coal: .2,
                ironPlate: 5
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 1,
            pollution: 20,
            group: 'smelter'
        },
        advancedSmelterIron: {
            name: 'Advanced Iron Smelter',
            verb: 'smelt',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                ironPlate: 3
            },
            cost: {
                brick: 10,
                steel: 5
            },
            drain: {
                coal: .5,
                iron: 3
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 2,
            pollution: 40,
            group: 'smelterAdvanced'
        },
        advancedSmelterCopper: {
            name: 'Advanced Copper Smelter',
            verb: 'smelt',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                copperPlate: 3
            },
            cost: {
                brick: 10,
                steel: 5
            },
            drain: {
                coal: .5,
                copper: 3
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 2,
            pollution: 40,
            group: 'smelterAdvanced'
        },
        advancedSmelterStone: {
            name: 'Advanced Stone Smelter',
            verb: 'smelt',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                brick: 3
            },
            cost: {
                brick: 10,
                steel: 5
            },
            drain: {
                coal: .5,
                stone: 6
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 2,
            pollution: 40,
            group: 'smelterAdvanced'
        },
        advancedSmelterSteel: {
            name: 'Advanced Steel Smelter',
            verb: 'smelt',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                steel: 3
            },
            cost: {
                brick: 10,
                steel: 5
            },
            drain: {
                coal: .5,
                ironPlate: 15
            },
            size: {
                length: 2,
                width: 2,
                logistics: 4
            },
            waste: 2,
            pollution: 40,
            group: 'smelterAdvanced'
        },
        electricSmelterIron: {
            name: 'Electric Iron Smelter',
            verb: 'smelt',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                ironPlate: 5
            },
            cost: {
                brick: 10,
                steel: 10,
                redChip: 5
            },
            drain: {
                electricity: 20,
                iron: 3
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 3,
            pollution: 10,
            group: 'smelterElectric'
        },
        electricSmelterCopper: {
            name: 'Electric Copper Smelter',
            verb: 'smelt',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                copperPlate: 5
            },
            cost: {
                brick: 10,
                steel: 10,
                redChip: 5
            },
            drain: {
                electricity: 20,
                copper: 3
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 3,
            pollution: 10,
            group: 'smelterElectric'
        },
        electricSmelterStone: {
            name: 'Electric Stone Smelter',
            verb: 'smelt',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                brick: 5
            },
            cost: {
                brick: 10,
                steel: 10,
                redChip: 5
            },
            drain: {
                electricity: 20,
                stone: 6
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 3,
            pollution: 10,
            group: 'smelterElectric'
        },
        electricSmelterSteel: {
            name: 'Electric Steel Smelter',
            verb: 'smelt',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                steel: 5
            },
            cost: {
                brick: 10,
                steel: 10,
                redChip: 5
            },
            drain: {
                electricity: 20,
                ironPlate: 15
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 3,
            pollution: 10,
            group: 'smelterElectric'
        },
        steamEngine: {
            name: 'Steam Engine',
            verb: 'produce',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {
                electricity: 100
            },
            cost: {
                ironPlate: 10,
                cog: 9,
                pipe: 10,
                stone: 5,
                greenChip: 2
            },
            drain: {
                coal: 1
            },
            size: {
                length: 2,
                width: 3,
                logistics: 2
            },
            waste: 1,
            pollution: 80,
            group: 'electricity'
        },
        solarPanel: {
            name: 'Solar Panel',
            verb: 'produce',
            period: 0,
            amount: 0,
            efficiency: .5,
            produces: {
                electricity: 70
            },
            cost: {
                greenChip: 15,
                steel: 5,
                copperPlate: 5
            },
            drain: {},
            size: {
                length: 3,
                width: 3,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'electricity'
        },
        oilPump: {
            name: 'Oil Pump',
            verb: 'harvest',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                oil: 10
            },
            cost: {
                greenChip: 5,
                steel: 5,
                cog: 10,
                pipe: 20
            },
            drain: {
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 1
            },
            waste: 1,
            pollution: 30,
            group: 'liquid'
        },
        waterPump: {
            name: 'Water Pump',
            verb: 'harvest',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                water: 10
            },
            cost: {
                greenChip: 2,
                cog: 5,
                pipe: 15
            },
            drain: {
                electricity: 5
            },
            size: {
                length: 3,
                width: 1,
                logistics: 1
            },
            waste: 0,
            pollution: 0,
            group: 'liquid'
        },
        oilRefinery: {
            name: 'Oil Refinery',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                lightOil: 6,
                petroleum: 4
            },
            cost: {
                greenChip: 10,
                cog: 10,
                pipe: 30,
                steel: 15,
                brick: 10
            },
            drain: {
                electricity: 35,
                oil: 10
            },
            size: {
                length: 5,
                width: 5,
                logistics: 3
            },
            waste: 5,
            pollution: 50,
            group: 'liquid'
        },
        lightOilCrackingChemicalPlant: {
            name: 'Light Oil to Petroleum',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                petroleum: 2,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                water: 6,
                lightOil: 7
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        sulfurChemicalPlant: {
            name: 'Sulfur Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                sulfur: 2,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                water: 3,
                petroleum: 3
            },
            size: {
                length: 3,
                width: 3,
                logistics: 5
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        sulfuricAcidChemicalPlant: {
            name: 'Sulfuric Acid Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                sulfuricAcid: 5,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                sulfur: 5,
                ironPlate: 1,
                water: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 8
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        plasticChemicalPlant: {
            name: 'Plastic Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                plastic: 2,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                coal: 1,
                petroleum: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 7
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        batteryChemicalPlant: {
            name: 'Battery Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                battery: 1,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                ironPlate: 1,
                copperPlate: 1,
                sulfuricAcid: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 7
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        lubricantChemicalPlant: {
            name: 'Lubricant Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                lubricant: 1,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                lightOil: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 2
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        solidFuelLightOilChemicalPlant: {
            name: 'Solid Fuel Chemical Plant - from light oil',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                solidFuel: 1,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                lightOil: 3
            },
            size: {
                length: 3,
                width: 3,
                logistics: 4
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        solidFuelPetroleumChemicalPlant: {
            name: 'Solid Fuel Chemical Plant - from petroleum',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                solidFuel: 1,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                petroleum: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 4
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        explosivesChemicalPlant: {
            name: 'Explosives Chemical Plant',
            verb: 'refine',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                explosives: 1,
            },
            cost: {
                greenChip: 5,
                cog: 5,
                pipe: 10,
                steel: 5
            },
            drain: {
                electricity: 25,
                sulfur: 1,
                coal: 1,
                water: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 7
            },
            waste: 3,
            pollution: 50,
            group: 'liquid'
        },
        cogAssembler: {
            name: 'Cog Assembler',
            verb: 'produce',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                cog: 1
            },
            cost: {
                ironPlate: 30,
                cog: 20,
                rod: 10,
                greenChip: 10
            },
            drain: {
                ironPlate: 1,
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 1,
            pollution: 30,
            group: 't1Production'
        },
        rodAssembler: {
            name: 'Iron Rod Assembler',
            verb: 'produce',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                rod: 1
            },
            cost: {
                ironPlate: 30,
                cog: 20,
                rod: 10,
                greenChip: 10
            },
            drain: {
                ironPlate: 1,
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 1,
            pollution: 30,
            group: 't1Production'
        },
        pipeAssembler: {
            name: 'Pipe Assembler',
            verb: 'produce',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                pipe: 1
            },
            cost: {
                ironPlate: 30,
                cog: 20,
                rod: 10,
                greenChip: 10
            },
            drain: {
                ironPlate: 1,
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 1,
            pollution: 30,
            group: 't1Production'
        },
        wireAssembler: {
            name: 'Wire Assembler',
            verb: 'produce',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                wire: 1
            },
            cost: {
                ironPlate: 30,
                cog: 20,
                rod: 10,
                greenChip: 10
            },
            drain: {
                copperPlate: 1,
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 1,
            pollution: 30,
            group: 't1Production'
        },
        greenChipAssembler: {
            name: 'Green Chip Assembler',
            verb: 'produce',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                greenChip: 1
            },
            cost: {
                ironPlate: 30,
                cog: 20,
                rod: 10,
                greenChip: 10
            },
            drain: {
                wire: 3,
                ironPlate: 1,
                electricity: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 1,
            pollution: 30,
            group: 't1Production'
        },
        concreteAssembler: {
            name: 'Concrete Assembler',
            verb: 'produce',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                concrete: 1
            },
            cost: {
                ironPlate: 60,
                cog: 40,
                rod: 20,
                greenChip: 20
            },
            drain: {
                brick: 5,
                iron: 1,
                water: 10,
                electricity: 20
            },
            size: {
                length: 3,
                width: 3,
                logistics: 7
            },
            waste: 2,
            pollution: 50,
            group: 't2Production'
        },
        engineAssembler: {
            name: 'Engine Assembler',
            verb: 'produce',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                engine: 1
            },
            cost: {
                ironPlate: 60,
                cog: 40,
                rod: 20,
                greenChip: 20
            },
            drain: {
                electricity: 20,
                cog: 1,
                steel: 1,
                pipe: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 2,
            pollution: 50,
            group: 't2Production'
        },
        redChipAssembler: {
            name: 'Red Chip Assembler',
            verb: 'produce',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                redChip: 1
            },
            cost: {
                ironPlate: 60,
                cog: 40,
                rod: 20,
                greenChip: 20
            },
            drain: {
                electricity: 20,
                greenChip: 2,
                wire: 4,
                plastic: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 2,
            pollution: 50,
            group: 't2Production'
        },
        electricEngineAssmebler: {
            name: 'Electric Engine Assembler',
            verb: 'produce',
            period: 5,
            amount: 0,
            efficiency: 1,
            produces: {
                electricEngine: 1
            },
            cost: {
                ironPlate: 120,
                cog: 80,
                rod: 40,
                greenChip: 60,
                redChip: 20
            },
            drain: {
                electricity: 25,
                lubricant: 15,
                engine: 1,
                greenChip: 2
            },
            size: {
                length: 3,
                width: 3,
                logistics: 7
            },
            waste: 4,
            pollution: 70,
            group: 't3Production'
        },
        purpleChipAssembler: {
            name: 'Purple Chip Assembler',
            verb: 'produce',
            period: 5,
            amount: 0,
            efficiency: 1,
            produces: {
                purpleChip: 1
            },
            cost: {
                ironPlate: 120,
                cog: 80,
                rod: 40,
                greenChip: 60,
                redChip: 20
            },
            drain: {
                electricity: 25,
                greenChip: 20,
                redChip: 2,
                sulfuricAcid: 5
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 2,
            pollution: 50,
            group: 't3Production'
        },
        robotBodyAssembler: {
            name: 'Robot Body Assembler',
            verb: 'produce',
            period: 5,
            amount: 0,
            efficiency: 1,
            produces: {
                robotBody: 1
            },
            cost: {
                ironPlate: 120,
                cog: 80,
                rod: 40,
                greenChip: 60,
                redChip: 20
            },
            drain: {
                electricity: 25,
                electricEngine: 1,
                battery: 2,
                steel: 1,
                greenChip: 3
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 4,
            pollution: 70,
            group: 't3Production'
        },
        roboticsFacility: {
            name: 'Robotics Facility',
            verb: 'robot housing',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {
                robotSpace: 8
            },
            cost: {
                steel: 45,
                cog: 45,
                redChip: 45
            },
            drain: {
                electricity: 100
            },
            size: {
                length: 4,
                width: 4,
                logistics: 0
            },
            waste: 4,
            pollution: 70,
            group: 'robotics'
        },
        logisticsRobot: {
            name: 'Logistics Robot',
            verb: 'produce',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {},
            cost: {
                robotBody: 1,
                redChip: 2
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'robotics'
        },
        recyclerRobot: {
            name: 'Recycler Robot',
            verb: 'produce',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {},
            cost: {
                robotBody: 1,
                purpleChip: 1
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 0,
                width: 0,
                logistics: 0
            },
            waste: 0,
            pollution: 0,
            group: 'robotics'
        },
        airScrubberRobot: {
            name: 'Air Scubber Robot',
            verb: 'produce',
            period: 0,
            amount: 0,
            efficiency: 1,
            produces: {},
            cost: {
                robotBody: 1,
                purpleChip: 1
            },
            drain: {
                electricity: 5,
                robotSpace: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 0,
            pollution: 0,
            group: 'robotics'
        },
        researchLab1: {
            name: 'Research Lab 1',
            verb: 'research',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                science1: 1
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                copperPlate: 1,
                cog: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 3
            },
            waste: 2,
            pollution: 0,
            group: 'research'
        },
        researchLab2: {
            name: 'Research Lab 2',
            verb: 'research',
            period: 1,
            amount: 0,
            efficiency: 1,
            produces: {
                science2: 1
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                ironPlate: 2,
                cog: 2,
                greenChip: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 6
            },
            waste: 5,
            pollution: 0,
            group: 'research'
        },
        researchLab3: {
            name: 'Research Lab 3',
            verb: 'research',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                science3: 1
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                redChip: 1,
                engine: 1,
                greenChip: 3,
                cog: 5,
                ironPlate: 10
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 10,
            pollution: 0,
            group: 'research'
        },
        researchLab4: {
            name: 'Research Lab 4',
            verb: 'research',
            period: 2,
            amount: 0,
            efficiency: 1,
            produces: {
                science4: 2
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                ironPlate: 30,
                cog: 10,
                coal: 10,
                copperPlate: 15,
                steel: 1,
                explosives: 1
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 33,
            pollution: 0,
            group: 'research'
        },
        researchLab5: {
            name: 'Research Lab 5',
            verb: 'research',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                science5: 2
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                electricEngine: 1,
                greenChip: 3,
                redChip: 5,
                steel: 10,
                ironPlate: 10,
                brick: 10,
                cog: 5
            },
            size: {
                length: 3,
                width: 3,
                logistics: 12
            },
            waste: 15,
            pollution: 0,
            group: 'research'
        },
        researchLab6: {
            name: 'Research Lab 6',
            verb: 'research',
            period: 3,
            amount: 0,
            efficiency: 1,
            produces: {
                science6: 2
            },
            cost: {
                ironPlate: 4,
                cog: 15,
                greenChip: 10
            },
            drain: {
                electricity: 10,
                copper: 30,
                battery: 1,
                purpleChip: 3,
                greenChip: 5,
                redChip: 5
            },
            size: {
                length: 3,
                width: 3,
                logistics: 9
            },
            waste: 15,
            pollution: 0,
            group: 'research'
        }
    };
    
    var fromResourceMap = {
        cog: { ironPlate: 1 },
        rod: { ironPlate: 1 },
        pipe: { ironPlate: 1 },
        wire: { copperPlate: 1 },
        greenChip: { ironPlate: 1, wire: 3 }
    };
    
    var groupOrder = ['coalDrill', 'electricDrill', 'miningRobotics', 'smelter', 'smelterAdvanced', 'smelterElectric', 'research',
                      't1Production', 't2Production', 't3Production', 'robotics', 'liquid', 'electricity', 'manualObjects', 'misc'];
    
    var manualResources = ['wood', 'coal', 'iron', 'copper', 'stone', 'cog', 'pipe', 'wire', 'rod', 'greenChip'];
    var manualObjects = ['pickaxe', 'handProcessor'];
    
    var ID_PREFIX = {
        RESOURCE_BUTTON: '#btn-',
        OBJECT_AREA: '#area-',
        OBJECT_GROUP: '#object-group-'
    };
    
    function doForKeys(obj, func) {
        var i, len;
        var keys = Object.keys(obj);
        for (i = 0, len = keys.length; i < len; i++) {
            func(keys[i]);
        }
    }
    
    function updateUiValues() {
        updatePlanetInfo();
        updateObjects();
        updateResources();
        addListeners();
        saveInstanceData();
    }
    
    function saveInstanceData() {
        var buildings = {};
        doForKeys(building_objects, function(key) {
            buildings[key] = { amount: building_objects[key].amount, cost: building_objects[key].cost };
        });
        localStorage[STORAGE_KEY.PLAYER_OBJECTS] = JSON.stringify(buildings);
        
        localStorage[STORAGE_KEY.PLANET_TILES] = JSON.stringify(planetary_tiles);
        localStorage[STORAGE_KEY.PLANET_RESOURCES] = JSON.stringify(planetary_resources);
        localStorage[STORAGE_KEY.PLAYER_RESOURCES] = JSON.stringify(player_resources);
    }
    
    function updatePlanetInfo() {
        var planetTilesDiv = $('#planet-tiles');
        var planetResourcesDiv = $('#planet-resources');
        
        planetTilesDiv.add(planetResourcesDiv).empty();
        
        doForKeys(planetary_tiles, function(key) {
            var html = '<div>' + key + ': ' + planetary_tiles[key] + '</div>';
            planetTilesDiv.append(html);
        });
        
        planetTilesDiv.append('<div>usable remaining: ' + getTotalUsuableTiles() + '</div>');
        planetTilesDiv.append('<div>storage space: ' + getTotalStorageSpace() + '</div>');
        
        doForKeys(planetary_resources, function(key) {
            var html = '<div>' + key + ': ' + planetary_resources[key] + '</div>';
            planetResourcesDiv.append(html);
        });
    }
    
    function updateResources() {
        function changeButton(button, amount, generated) {
            button.find('.amount').html(amount);
            if (generated) {
                button.find('.generated').html(generated + ' per second');
                button.toggleClass('btn-primary', generated > 0);
                button.toggleClass('btn-danger', generated <= 0);
            }
        }
        
        doForKeys(nonAccumulativeResources, function(resourceKey) {
            var button = $(ID_PREFIX.RESOURCE_BUTTON + resourceKey);
            changeButton(button, nonAccumulativeResources[resourceKey]);
        });
        
        doForKeys(player_resources, function(resourceKey) {
            var button = $(ID_PREFIX.RESOURCE_BUTTON + resourceKey);
            var amount = roundTo(player_resources[resourceKey] || 0, 2);
            var totalGenerated = 0;
            doForKeys(building_objects, function(objKey) {
                var effObjQuant = getEffectiveObjectQuantity(objKey);
                var obj = building_objects[objKey];
                var objectProduction = (obj.produces[resourceKey] || 0) * obj.efficiency;
                var objectDrain = (obj.drain[resourceKey] || 0);
                totalGenerated += (objectProduction - objectDrain) * effObjQuant / (obj.period || 1);
            });
            totalGenerated = roundTo(totalGenerated || 0, 2);
            changeButton(button, amount, totalGenerated);
        });
    }
    
    function addListeners() {
        addManualResourceListeners();
        addObjectAreaListeners();
    }
    
    function addManualResourceListeners() {
        var i, len, button, fromResources;
        var manualResourceButtons = $('.manual-resource');
        
        manualResourceButtons.removeClass('disabled');
        for (i = 0, len = manualResourceButtons.length; i < len; i++) {
            button = $(manualResourceButtons[i]);
            fromResources = fromResourceMap[button[0].innerText.split('-')[0].trim()] || {};
            doForKeys(fromResources, function(key) {
                if (player_resources[key] < fromResources[key]) {
                    button.addClass('disabled');
                    return;
                }
            });
        }
        
        manualResourceButtons.off('click').on('click', function() {
            var key = this.innerText.split('-')[0].trim();
            manuallyHarvestResource(key);
        });
    }
    
    function addObjectAreaListeners() {
        $('.object-area').off('click').on('click', function() {
            var objectKey = this.id.split('-')[1];
            var obj = building_objects[objectKey];
            if (!canPurchase(obj)) {
                return;
            }
            
            decreasePlayerResourcesForObject(obj.cost);
            decreaseUsableTileSpaceForObject(obj.size);
            increaseObjectCount(obj);
            
            updateUiValues();
        });
    }
    
    function harvestPlanetaryResource(resourceKey, harvestAmount) {
        var amount = Math.min(planetary_resources[resourceKey], harvestAmount);
        player_resources[resourceKey] += amount;
        planetary_resources[resourceKey] -= amount;
    }
    
    function harvestProducedResource(resourceKey, harvestAmount) {
        var fromResources;
        var amount = Number.MAX_SAFE_INTEGER;
        if (fromResourceMap.hasOwnProperty(resourceKey)) {
            fromResources = fromResourceMap[resourceKey];
        } else {
            fromResources = {};
            fromResources[resourceKey] = 1;
        }
        
        doForKeys(fromResources, function(fromResourceKey) {
            var max = Math.floor(player_resources[fromResourceKey] / fromResources[fromResourceKey]);
            amount = Math.min(amount, max, harvestAmount);
        });
        
        player_resources[resourceKey] = (player_resources[resourceKey] || 0) + amount;
        doForKeys(fromResources, function(fromResourceKey) {
            var resourceAmount = amount * fromResources[fromResourceKey];
            player_resources[fromResourceKey] -= resourceAmount;
        });
    }
    
    function manuallyHarvestResource(resourceKey) {
        var harvestAmount, obj;
        if (planetary_resources.hasOwnProperty(resourceKey)) {
            obj = building_objects.pickaxe;
            harvestAmount = obj.amount * obj.efficiency;
            harvestPlanetaryResource(resourceKey, harvestAmount);
        } else {
            obj = building_objects.handProcessor;
            harvestAmount = obj.amount * obj.efficiency;
            harvestProducedResource(resourceKey, harvestAmount);
        }
        
        updateResources();
    }
    
    function autoHarvestResources() {
        doForKeys(nonAccumulativeResources, function(resourceKey) {
            var total = 0;
            doForKeys(building_objects, function(objKey) {
                var effObjQuant, multiplier;
                var obj = building_objects[objKey];
                var production = (obj.produces || {})[resourceKey] || 0;
                if (production) {
                    effObjQuant = getEffectiveObjectQuantity(objKey);
                    multiplier = effObjQuant * obj.efficiency;
                    total += multiplier * production;
                }
            });
            nonAccumulativeResources[resourceKey] = total;
        });
        
        
        doForKeys(nonAccumulativeResources, function(resourceKey) {
            doForKeys(building_objects, function(objKey) {
                var effObjQuant, multiplier;
                var obj = building_objects[objKey];
                var drain = (obj.drain || {})[resourceKey] || 0;
                if (drain) {
                    effObjQuant = getEffectiveObjectQuantity(objKey);
                    multiplier = effObjQuant * obj.efficiency;
                    nonAccumulativeResources[resourceKey] -= multiplier * drain;                    
                }
            });
        });
        
        
        doForKeys(building_objects, function(objKey) {
            var effObjQuant, multiplier;
            var obj = building_objects[objKey];
            var production = obj.produces;
            var amount = obj.amount;
            if (manualObjects.indexOf(objKey) > -1) {
                doForKeys(production, function(resourceKey) {
                    if (amount && !$(ID_PREFIX.RESOURCE_BUTTON + resourceKey).length) {
                        createResourceButton(resourceKey);
                    }
                });
                return;
            }
            
            effObjQuant = getEffectiveObjectQuantity(objKey);
            multiplier = effObjQuant * obj.efficiency / (obj.period ||  1);
            
            doForKeys(production, function(resourceKey) {
                var productionAmount = production[resourceKey] * multiplier;
                if (amount && !$(ID_PREFIX.RESOURCE_BUTTON + resourceKey).length) {
                    createResourceButton(resourceKey);
                }
                if (!nonAccumulativeResources.hasOwnProperty(resourceKey)) {
                    if (planetary_resources.hasOwnProperty(resourceKey)) {
                        harvestPlanetaryResource(resourceKey, productionAmount);
                    } else if (productionAmount) {
                        addPlayerResources(resourceKey, productionAmount);
                    }
                }
            });
        });
        
        
        doForKeys(building_objects, function(objKey) {
            var drain, effObjQuant, multiplier;
            var obj = building_objects[objKey];
            if (manualObjects.indexOf(objKey) > -1) return;
            
            drain = obj.drain;
            effObjQuant = getEffectiveObjectQuantity(objKey);
            multiplier = effObjQuant * obj.efficiency / (obj.period ||  1);
            
            if (multiplier) {
                doForKeys(drain, function(resourceKey) {
                    var drainAmount = roundTo(drain[resourceKey] * multiplier, 2);
                    if (!nonAccumulativeResources.hasOwnProperty(resourceKey)) {
                        player_resources[resourceKey] -= Math.min(player_resources[resourceKey], drainAmount);
                    }
                });
            }
        });
    }
    
    function addPlayerResources(resourceKey, amount) {
        player_resources[resourceKey] = player_resources.hasOwnProperty(resourceKey)
            ? player_resources[resourceKey] + amount : amount;
    }
    
    function getEffectiveObjectQuantity(objKey) {
        var eff, drain, production, period, totalProductionAmount;
        var obj = building_objects[objKey];
        var amount = obj.amount;
        if (!amount) return 0;
        
        eff = amount;
        drain = obj.drain;
        production = obj.produces;
        period = obj.period || 1;
        totalProductionAmount = 0;
        
        doForKeys(production, function(resourceKey) {
            if (!nonAccumulativeResources.hasOwnProperty(resourceKey)) {
                totalProductionAmount += production[resourceKey] / period;
            }
        });
        
        doForKeys(drain, function(resourceKey) {
            var maxDrain = nonAccumulativeResources.hasOwnProperty(resourceKey)
                ? nonAccumulativeResources[resourceKey]
                : (player_resources[resourceKey] || 0) / (drain[resourceKey] / period);
            eff = Math.min(eff, maxDrain);
            if (!eff) return 0;
        });
        
        if (getTotalStorageSpace() < totalProductionAmount) {
            return 0;
        }
        
        return eff;
    }
    
    function getTotalLogisticsSpace() {
        var total = 0;
        var numLogBots = getEffectiveObjectQuantity('logisticsRobot');
        var logBotEffectiveness = numLogBots * 25;
        doForKeys(building_objects, function(key) {
            var obj = building_objects[key];
            total += obj.amount * obj.size.logistics;
        });
        return Math.max(0, total - logBotEffectiveness);
    }
    
    function getTotalStorageSpace() {
        var total = 0;
        total += building_objects.storageCrateWood.amount * 1600;
        total += building_objects.storageCrateIron.amount * 3200;
        total += building_objects.storageCrateSteel.amount * 4800;
        doForKeys(player_resources, function(key) {
            total -= player_resources[key] || 0;
        })
        return roundTo(total, 2);
    }
    
    function canPurchase(obj) {
        function hasResources(cost) {
            var ret = true;
            doForKeys(cost, function(key) {
                if ((player_resources[key] || 0) < cost[key]) {
                    ret = false;
                }
            });
            return ret;
        }
        
        function hasSpace(size) {
            var tileSize = size.length * size.width;
            return getTotalUsuableTiles() >= tileSize + size.logistics;
        }
        
        return hasSpace(obj.size) && hasResources(obj.cost);
    }
    
    function getTotalUsuableTiles() {
        return planetary_tiles.total
            - planetary_tiles.water
            - planetary_tiles.waste
            - planetary_tiles.buildings
            - planetary_resources.wood
            - getTotalLogisticsSpace();
    }
    
    function decreasePlayerResourcesForObject(cost) {
        doForKeys(cost, function(key) {
            player_resources[key] -= Math.floor(cost[key]);
        });
    }
    
    function decreaseUsableTileSpaceForObject(size) {
        planetary_tiles.buildings += size.length * size.width;
        planetary_tiles.logistics += size.length;
    }
    
    function increaseObjectCount(obj) {
        var multiplier;
        var m = 1.1665;
        var cost = obj.cost;
        var oldAmount = obj.amount || 0;
        obj.amount++;
        multiplier = m ^ obj.amount;
        doForKeys(cost, function(key) {
            var origCost = cost[key] / m ^ oldAmount;
            cost[key] = origCost * multiplier;
        });
    }
    
    function updateObjects() {
        doForKeys(building_objects, function(key) {
            var groupDiv;
            var obj = building_objects[key];
            var amount = obj.amount;
            var efficiency = obj.efficiency;
            var produces = obj.produces;
            var total = amount * efficiency * (produces[Object.keys(produces)[0]] || 1);
            var id = ID_PREFIX.OBJECT_AREA + key
            var div = $(id);
            var canPur = canPurchase(obj);
            
            if ((amount || canPur) && !div.length) {
                div = addObjectGroupIfNeeded(key, obj);
            }
            
            div.find('.efficiency').html(efficiency);
            div.find('.amount').html(amount);
            div.find('.production').html(total);
            div.toggleClass('can-purchase', canPur);
            
            doForKeys(obj.cost, function(key) {
                div.find('.cost.' + key).html(Math.floor(obj.cost[key]));
            });
        }); 
    }
    
    function addObjectGroupIfNeeded(key, obj) {
        var div, group, groupDiv, id, i, len, otherGroupKey, otherGroupDiv, found;
        if (!obj.amount && !canPurchase(obj)) return;
        
        div = createBuildingObject(key);
        group = obj.group;
        id = ID_PREFIX.OBJECT_GROUP + group;
        groupDiv = $(id);
        if (!groupDiv.length) {
            groupDiv = $('<div id="' + id.substring(1) + '" class="object-group"></div>');
            found = false;
            for (i = groupOrder.indexOf(group) - 1; i >= 0; i--) {
                otherGroupKey = groupOrder[i];
                otherGroupDiv = $(ID_PREFIX.OBJECT_GROUP + otherGroupKey);
                if (otherGroupDiv.length) {
                    otherGroupDiv.after(groupDiv);
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (i = groupOrder.indexOf(group) + 1, len = groupOrder.length; i < len; i++) {
                    otherGroupKey = groupOrder[i];
                    otherGroupDiv = $(ID_PREFIX.OBJECT_GROUP + otherGroupKey);
                    if (otherGroupDiv.length) {
                        otherGroupDiv.before(groupDiv);
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                $('#objects').append(groupDiv);
            }
        }
        groupDiv.append(div);
        return div;
    }
    
    function initView() {
        updatePlanetInfo();
        
        doForKeys(player_resources, function(key) {
            createResourceButton(key);
        });
        
        doForKeys(building_objects, function(key) {
            addObjectGroupIfNeeded(key, building_objects[key]);
        });
        
        $('#clear-timer').on('click', function() {
            clearInterval(timer);
        });
        
        $('#start-timer').on('click', function() {
            timer = setInterval(function() {
            autoHarvestResources();
            updateUiValues();
        }, 1000);
        });
        
        $('#erase-data').on('click', function() {
            doForKeys(STORAGE_KEY, function(key) {
                delete localStorage[STORAGE_KEY[key]];
            });
        });
        
        applySavedBuildingAmounts();
    }
    
    function applySavedBuildingAmounts() {
        var buildings = getSavedValue(STORAGE_KEY.PLAYER_OBJECTS) || {};
        doForKeys(buildings, function(objKey) {
            building_objects[objKey].amount = buildings[objKey].amount;
            building_objects[objKey].cost = buildings[objKey].cost;
        });
    }
    
    function createResourceButton(key) {
        var id = ID_PREFIX.RESOURCE_BUTTON.substring(1) + key;
        var manualResourceClass = manualResources.indexOf(key) === -1 ? '' : ' manual-resource';
        var html = '<button id="' + id + '" class="btn btn-primary' + manualResourceClass + '">' + key
                 + ' - <span class="amount"></span> - <span class="generated"></span></button>';
        var resourceDiv = $(nonAccumulativeResources.hasOwnProperty(key) ? '#non-accumulative-resources' : '#resources');
        resourceDiv.append(html);
    }
    
    function createBuildingObject(key) {
        function generateCostHtml(cost, cssClass) {
            var vars = [];
            doForKeys(cost, function(key) {
                vars.push(key + ': <span class="' + cssClass + ' ' + key + '">' + cost[key] + '</span>');
            });
            return vars.join(', ');
        }
        
        var html, div;
        var obj = building_objects[key];
        var period = manualObjects.indexOf(key) > -1 ? 'click' : 'second';
        var group = obj.group;
        var id = ID_PREFIX.OBJECT_AREA.substring(1) + key;
        var objProduction = {};
        
        doForKeys(obj.produces, function(key) {
            objProduction[key] = obj.produces[key] * obj.efficiency * obj.amount;
        });
        
        html = '<div class="object-area" id="' + id + '">'
                 + '<div>' + obj.name + '</div>'
                 + '<div>Cost: ' + generateCostHtml(obj.cost, 'cost') + '</div>'
                 + '<div>Drain: ' + generateCostHtml(obj.drain, 'drain') + '</div>'
                 + '<div><span class="amount"></span> - ' + generateCostHtml(objProduction, 'production') + ' per '+ period + '</div>'
                 + '</div>';
        div = $(html);
        return div;
    }
    
    function init() {
        initView();
        updateUiValues();
        timer = setInterval(function() {
            autoHarvestResources();
            updateUiValues();
        }, 1000);
    }
    
    init();
});