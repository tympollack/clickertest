$(function($) {
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
        n = (Math.round(n) / multiplier).toFixed(digits);
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
    
    var STORAGE_KEY = {
        DISCOVERED_TILES: 'discoveredTiles',
        NONACC_RESOURCES: 'nonAccumulativeResources',
        PLANET_TILES: 'planetTiles',
        PLANET_RESOURCES: 'planetResources',
        PLAYER_RESOURCES: 'playerResources',
        PLAYER_OBJECTS: 'playerObjects'
    };

    var isNewGame = !getSavedValue(STORAGE_KEY.PLANET_TILES);
    
    var planetary_tiles = getSavedValue(STORAGE_KEY.PLANET_TILES) || {
        total: 123000000000, // 123 b acres
        pollution: 0,
        waste: 0,
        logistics: 0,
        buildings: 0
    };
    
    var planetary_resources = getSavedValue(STORAGE_KEY.PLANET_RESOURCES) || {
        water:   86000000000,
        wood:    14500000000,
        iron:     6930000000,
        stone:    6890000000,
        oil:        76800000,
        coal:       24600000,
        copper:      7380000,
        uranium:      332000
    };

    var RESOURCE_WEIGHT_BY_ACRE = {
        wood:     770,
        coal:    1346,
        iron:    2500,
        copper:  2265,
        stone:   2515,
        oil:      881,
        uranium: 5145,
        water:   1000
    };

    var discovered_tiles = getSavedValue(STORAGE_KEY.DISCOVERED_TILES) || {
        wood: 0,
        coal: 0,
        iron: 0,
        copper: 0,
        stone: 0,
        oil: 0,
        uranium: 0,
        water: 0,
        land: 0,
        damagedLand: 0
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
    
    var fromResourceMap = {
        cog: { ironPlate: 1 },
        rod: { ironPlate: 1 },
        pipe: { ironPlate: 1 },
        wire: { copperPlate: 1 },
        greenChip: { ironPlate: 1, wire: 3 }
    };
    
    var groupOrder = ['manualObjects', 'misc', 'coalDrill', 'electricDrill', 'miningRobotics', 'smelter', 'smelterAdvanced', 'smelterElectric', 'research',
                      't1Production', 't2Production', 't3Production', 'robotics', 'liquid', 'electricity', 'storage'];
    
    var manualResources = ['wood', 'coal', 'iron', 'copper', 'stone', 'cog', 'pipe', 'wire', 'rod', 'greenChip'];
    var manualObjects = ['pickaxe', 'handProcessor', 'explore', 'restoreLand'];
    var radarObjects = ['radarTowerSmall'];
    var excavationObjects = ['excavator1'];

    var ID_PREFIX = {
        RESOURCE_BUTTON: '#btn-',
        OBJECT_AREA: '#area-',
        OBJECT_GROUP: '#object-group-'
    };

    var timer = null;
    var STARTING_TILES  =         100000;
    var SMALLEST_PLANET =    11000000000; // 11 billion acres
    var LARGEST_PLANET  = 29595000000000; // 29.6 quadrillion acres
    var BUILDING_STATUS = { on: 1, off: 0 };
    
    function doForKeys(obj, func) {
        var i, len, key;
        var keys = Object.keys(obj);
        for (i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            func(key, obj[key]);
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
        doForKeys(building_objects, function(key, value) {
            buildings[key] = {
                amount: value.amount,
                cost: value.cost,
                status: value.status
            };
        });
        localStorage[STORAGE_KEY.PLAYER_OBJECTS] = JSON.stringify(buildings);
        localStorage[STORAGE_KEY.PLANET_TILES] = JSON.stringify(planetary_tiles);
        localStorage[STORAGE_KEY.PLANET_RESOURCES] = JSON.stringify(planetary_resources);
        localStorage[STORAGE_KEY.PLAYER_RESOURCES] = JSON.stringify(player_resources);
        localStorage[STORAGE_KEY.DISCOVERED_TILES] = JSON.stringify(discovered_tiles);
    }
    
    function updatePlanetInfo() {
        var planetTilesDiv = $('#planet-tiles');
        var discoveredTilesDiv = $('#discovered-tiles');
        var planetResourcesDiv = $('#planet-resources');
        
        planetTilesDiv.add(discoveredTilesDiv).add(planetResourcesDiv).empty();
        
        doForKeys(planetary_tiles, function(key, value) {
            var html = '<div>' + key + ': ' + value + '</div>';
            planetTilesDiv.append(html);
        });

        doForKeys(discovered_tiles, function(key, value) {
            var val = roundTo(value, 3);
            var html = '<div>' + key + ': ' + val + '</div>';
            discoveredTilesDiv.append(html);
        });
        discoveredTilesDiv.append('<div>usable remaining: ' + Math.floor(getTotalUsableTiles()) + '</div>');
        discoveredTilesDiv.append('<div>storage space: ' + getTotalStorageSpace() + '</div>');
        
        doForKeys(planetary_resources, function(key, value) {
            var val = roundTo(value, 3);
            var html = '<div>' + key + ': ' + val + '</div>';
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
        
        doForKeys(nonAccumulativeResources, function(resourceKey, value) {
            var button = $(ID_PREFIX.RESOURCE_BUTTON + resourceKey);
            changeButton(button, value);
        });
        
        doForKeys(player_resources, function(resourceKey, value) {
            var button = $(ID_PREFIX.RESOURCE_BUTTON + resourceKey);
            var amount = roundTo(value || 0, 2);
            var totalGenerated = 0;
            doForKeys(building_objects, function(objKey, obj) {
                var effObjQuant = getEffectiveObjectQuantity(obj);
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
            doForKeys(fromResources, function(key, value) {
                if (player_resources[key] < value) {
                    button.addClass('disabled');
                }
            });
        }
        
        manualResourceButtons.off('click').on('click', function() {
            var key = this.innerText.split('-')[0].trim();
            manuallyHarvestResource(key);
        });
    }
    
    function addObjectAreaListeners() {
        function onSwitchClick(_this) {
            var areaDiv = _this.closest('.object-area');
            var objectKey = areaDiv[0].id.split('-')[1];
            var otherSelector = _this[0].innerText === 'On' ? offClass : onClass;
            var addClass = otherSelector === offClass ? 'btn-success' : 'btn-danger';
            var removeClass = otherSelector === offClass ? 'btn-danger' : 'btn-success';
            var status = otherSelector === offClass ? 'on' : 'off';
            areaDiv.find('.' + otherSelector).removeClass(removeClass);
            _this.addClass(addClass);
            building_objects[objectKey].status = BUILDING_STATUS[status];
        }

        var objectAreas = $('.object-area');
        var onClass = 'object-on';
        var offClass = 'object-off';
        objectAreas.off('click').on('click', function(e) {
            var amount;
            var objectKey = this.id.split('-')[1];
            var obj = building_objects[objectKey];
            if (e.target.classList.contains('btn') || !canPurchase(obj)) return;

            decreasePlayerResourcesForObject(obj.cost);
            decreaseUsableTileSpaceForObject(obj.size);
            increaseObjectCount(obj);

            if (objectKey === 'explore') {
                amount = Math.min(obj.efficiency, planetary_tiles.total);
                discoverTiles(amount);
            } else if (objectKey === 'restoreLand') {
                amount = Math.floor(Math.min(obj.efficiency, discovered_tiles.damagedLand));
                discovered_tiles.damagedLand -= amount;
                discovered_tiles.land += amount;
            }
            
            updateUiValues();
        });

        objectAreas.find('.object-on').off('click').on('click', function(e) {
            onSwitchClick($(this));
            e.preventDefault();
        });

        objectAreas.find('.object-off').off('click').on('click', function(e) {
            onSwitchClick($(this));
            e.preventDefault();
        });
    }
    
    function harvestPlanetaryResource(resourceKey, harvestAmount) {
        var amount = Math.min(planetary_resources[resourceKey], harvestAmount);
        var acreAmount = amount / RESOURCE_WEIGHT_BY_ACRE[resourceKey];
        player_resources[resourceKey] += amount;
        planetary_resources[resourceKey] -= acreAmount;
        discovered_tiles[resourceKey] -= acreAmount;
        discovered_tiles.damagedLand += acreAmount;
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
        
        doForKeys(fromResources, function(fromResourceKey, value) {
            var max = player_resources[fromResourceKey] / value;
            amount = Math.floor(Math.min(amount, max, harvestAmount));
        });
        
        player_resources[resourceKey] = (player_resources[resourceKey] || 0) + amount;
        doForKeys(fromResources, function(fromResourceKey, value) {
            player_resources[fromResourceKey] -= amount * value;
        });
    }
    
    function manuallyHarvestResource(resourceKey) {
        var harvestAmount, obj, func;
        if (planetary_resources.hasOwnProperty(resourceKey)) {
            obj = building_objects.pickaxe;
            func = harvestPlanetaryResource;
        } else {
            obj = building_objects.handProcessor;
            func = harvestProducedResource;
        }
        harvestAmount = Math.min(obj.amount * obj.efficiency, getTotalStorageSpace());
        func(resourceKey, harvestAmount);
        
        updateResources();
    }
    
    function autoHarvestResources() {
        doForKeys(nonAccumulativeResources, function(resourceKey) {
            var total = 0;
            doForKeys(building_objects, function(objKey, obj) {
                var effObjQuant, multiplier;
                var production = (obj.produces || {})[resourceKey] || 0;
                if (production) {
                    effObjQuant = getEffectiveObjectQuantity(obj);
                    multiplier = effObjQuant * obj.efficiency;
                    total += multiplier * production;
                }
            });
            nonAccumulativeResources[resourceKey] = total;
        });
        
        
        doForKeys(nonAccumulativeResources, function(resourceKey) {
            doForKeys(building_objects, function(objKey, obj) {
                var drain = (obj.drain || {})[resourceKey] || 0;
                if (drain) {
                    nonAccumulativeResources[resourceKey] -= getEffectiveObjectQuantity(obj) * drain;
                }
            });
        });
        
        
        doForKeys(building_objects, function(objKey, obj) {
            var effObjQuant, multiplier, m;
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
            
            effObjQuant = getEffectiveObjectQuantity(obj);
            multiplier = effObjQuant * obj.efficiency / (obj.period ||  1);

            if (radarObjects.indexOf(objKey) > -1) {
                discoverTiles(multiplier);
                return;
            }
            if (excavationObjects.indexOf(objKey) > -1) {
                m = Math.min(multiplier, discovered_tiles.damagedLand);
                discovered_tiles.damagedLand -= m;
                discovered_tiles.land += m;
            }

            doForKeys(production, function(resourceKey, value) {
                var productionAmount = value * multiplier;
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
        
        
        doForKeys(building_objects, function(objKey, obj) {
            var effObjQuant, multiplier;
            if (manualObjects.indexOf(objKey) > -1) return;
            
            effObjQuant = getEffectiveObjectQuantity(obj);
            multiplier = effObjQuant * obj.efficiency / (obj.period ||  1);
            
            if (multiplier) {
                doForKeys(obj.drain, function(resourceKey, value) {
                    var drainAmount = roundTo(value * multiplier, 2);
                    if (!nonAccumulativeResources.hasOwnProperty(resourceKey)) {
                        player_resources[resourceKey] -= Math.min(player_resources[resourceKey], drainAmount);
                    }
                });
            }
        });
    }
    
    function addPlayerResources(resourceKey, amount) {
        player_resources[resourceKey] = (player_resources[resourceKey] || 0) + amount;
    }
    
    function getEffectiveObjectQuantity(obj) {
        var period, totalProductionAmount, eff;
        obj = typeof obj === 'object' ? obj : building_objects[obj];
        eff = obj.amount;
        if (!eff || !obj.status) return 0;
        
        period = obj.period || 1;
        totalProductionAmount = 0;
        
        doForKeys(obj.produces, function(resourceKey, value) {
            if (!nonAccumulativeResources.hasOwnProperty(resourceKey)) {
                totalProductionAmount += value / period;
            }
        });
        
        doForKeys(obj.drain, function(resourceKey, value) {
            var maxDrain;
            if (!eff) return;
            maxDrain = nonAccumulativeResources[resourceKey] || player_resources[resourceKey] || 0;
            maxDrain /= value / period;
            eff = Math.min(eff, maxDrain);
        });
        
        if (!eff || (!nonAccumulativeResources && getTotalStorageSpace() <= totalProductionAmount)) {
            return 0;
        }
        
        return eff;
    }
    
    function getTotalLogisticsSpace() {
        var total = 0;
        var facility = building_objects.roboticsFacility;
        var logBot = building_objects.logisticsRobot;
        var numLogBots = Math.min(facility.amount * facility.produces.robotSpace, logBot.amount);
        var logBotEffectiveness = numLogBots * logBot.efficiency;
        doForKeys(building_objects, function(key, obj) {
            total += obj.amount * obj.size.logistics;
        });
        return Math.max(0, total - logBotEffectiveness);
    }
    
    function getTotalStorageSpace() {
        var total = 0;
        total += building_objects.storageCrateWood.amount * 1600;
        total += building_objects.storageCrateIron.amount * 3200;
        total += building_objects.storageCrateSteel.amount * 4800;
        doForKeys(player_resources, function(key, value) {
            total -= value || 0;
        });
        return roundTo(total, 2);
    }
    
    function canPurchase(obj) {
        function hasResources(cost) {
            var ret = true;
            doForKeys(cost, function(key, value) {
                if ((player_resources[key] || 0) < value) {
                    ret = false;
                }
            });
            return ret;
        }
        
        function hasSpace(size) {
            var tileSize = size.length * size.width;
            return getTotalUsableTiles() >= tileSize + size.logistics;
        }

        function otherConditions() {
            if (obj.name === 'Restore Land') {
                return discovered_tiles.damagedLand >= 1;
            }
            return true;
        }
        
        return hasSpace(obj.size) && hasResources(obj.cost) && otherConditions();
    }
    
    function getTotalUsableTiles() {
        // return planetary_tiles.total
        //     - planetary_resources.water
        //     - planetary_tiles.waste
        //     - planetary_tiles.buildings
        //     - planetary_resources.wood
        //     - getTotalLogisticsSpace();
        return discovered_tiles.land
            - planetary_tiles.buildings
            - planetary_tiles.waste
            - getTotalLogisticsSpace();
    }
    
    function decreasePlayerResourcesForObject(cost) {
        doForKeys(cost, function(key, value) {
            player_resources[key] -= Math.floor(value);
        });
    }
    
    function decreaseUsableTileSpaceForObject(size) {
        planetary_tiles.buildings += size.length * size.width;
        planetary_tiles.logistics += size.logistics;
    }
    
    function increaseObjectCount(obj) {
        var m = 1.15;
        var cost = obj.cost;
        var oldAmount = obj.amount || 0;
        var multiplier = Math.pow(m, ++obj.amount);
        doForKeys(cost, function(key, value) {
            var origCost = value / Math.pow(m, oldAmount);
            cost[key] = origCost * multiplier;
        });
    }
    
    function updateObjects() {
        doForKeys(building_objects, function(key, obj) {
            var amount = obj.amount;
            var efficiency = obj.efficiency;
            var produces = obj.produces;
            var total = amount * efficiency * (produces[Object.keys(produces)[0]] || 1);
            var id = ID_PREFIX.OBJECT_AREA + key;
            var div = $(id);
            
            if (!div || !div.length) {
                div = addObjectGroupIfNeeded(key, obj);
            }
            
            div.find('.efficiency').html(efficiency);
            div.find('.amount').html(amount);
            div.find('.production').html(total);
            div.toggleClass('can-purchase', canPurchase(obj));
            
            doForKeys(obj.cost, function(key, value) {
                div.find('.cost.' + key).html(Math.floor(value));
            });
        }); 
    }
    
    function addObjectGroupIfNeeded(key, obj) {
        var i, len, otherGroupKey, otherGroupDiv, found;
        var div = createBuildingObject(key);
        var group = obj.group;
        var id = ID_PREFIX.OBJECT_GROUP + group;
        var groupDiv = $(id);
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

    function discoverTiles(numTiles) {
        var i, rand, boundary;
        var total = planetary_tiles.total;
        
        for (i = 0; i < numTiles; i++) {
            boundary = 0;
            rand = Math.random();
            doForKeys(planetary_resources, function(key, value) {
                if (rand) {
                    boundary += (value - discovered_tiles[key]) / total;
                    if (rand < boundary) {
                        discovered_tiles[key]++;
                        rand = 0;
                    }
                }
            });
            if (rand) {
                discovered_tiles.land++;
                rand = 0;
            }
        }
    }

    function randomizePlanet() {
        var max = Math.floor(Math.random() * (LARGEST_PLANET - SMALLEST_PLANET) + SMALLEST_PLANET);
        planetary_tiles.total = max;
        doForKeys(planetary_resources, function(key) {
            var amount = Math.floor(Math.random() * max);
            planetary_resources[key] = amount;
            max -= amount;
        });
    }

    function initGame() {
        if (!isNewGame) return;
        randomizePlanet();
        discoverTiles(STARTING_TILES);
        planetary_tiles.buildings = 1;
        saveInstanceData();
    }
    
    function initView() {
        updatePlanetInfo();
        
        doForKeys(player_resources, function(key) {
            createResourceButton(key);
        });
        
        doForKeys(building_objects, function(key, obj) {
            addObjectGroupIfNeeded(key, obj);
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
            doForKeys(STORAGE_KEY, function(key, value) {
                delete localStorage[value];
            });
        });
        
        applySavedBuildingAmounts();
    }
    
    function applySavedBuildingAmounts() {
        var buildings = getSavedValue(STORAGE_KEY.PLAYER_OBJECTS) || {};
        doForKeys(buildings, function(objKey, obj) {
            var buildingObject = building_objects[objKey];
            buildingObject.amount = obj.amount;
            buildingObject.cost = obj.cost;
            buildingObject.status = isNullUndefined(obj.status) ? true : obj.status;
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
            doForKeys(cost, function(key, value) {
                vars.push(key + ': <span class="' + cssClass + ' ' + key + '">' + value + '</span>');
            });
            return vars.join(', ');
        }
        
        var html, div;
        var obj = building_objects[key];
        var isManualObject = manualObjects.indexOf(key) > -1;
        var period = isManualObject ? 'click' : 'second';
        var onOffBtns = isManualObject ? '' : '<div><button class="btn btn-default object-on">On</button></div><div><button class="btn btn-default object-off">Off</button></div>';
        var id = ID_PREFIX.OBJECT_AREA.substring(1) + key;
        var objProduction = {};
        
        doForKeys(obj.produces, function(key, value) {
            objProduction[key] = value * obj.efficiency * obj.amount;
        });
        
        html = '<div class="object-area" id="' + id + '">'
             + '<div class="object-switch">' + onOffBtns + '</div>'
             + '<div>' + obj.name + '</div>'
             + '<div>Cost: ' + generateCostHtml(obj.cost, 'cost') + '</div>'
             + '<div>Drain: ' + generateCostHtml(obj.drain, 'drain') + '</div>'
             + '<div><span class="amount"></span> - ' + generateCostHtml(objProduction, 'production') + ' per '+ period + '</div>'
             + '</div>';
        div = $(html);
        return div;
    }
    
    function init() {
        initGame();
        initView();
        updateUiValues();
        timer = setInterval(function() {
            autoHarvestResources();
            updateUiValues();
        }, 1000);
    }
    
    init();
});