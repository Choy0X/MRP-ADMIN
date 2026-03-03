const MRCore = exports['PHOENIX-RP'].GetCoreObject();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let Permissions = [];

const PlayerSrvID = GetPlayerServerId(PlayerId());

const PlayerServerID = PlayerSrvID.toString();

let MenuOpen = false;

let SavedBlips = {};

let InventoryItems = [];

const MainMenuOptions = {
    noclip: false,
    godmode: false,
    invisible: false,
    playerblips: false,
    unlimitedstamina: false,
    fastrun: false,
    superjump: false,
    noragdoll: false,
    freezeplayer: false,
    deletelazer: false,
    debug_coords: false,
    reviveradius: 30, //number
    setarmor: 100, //number
    spawnobject: '', //string
    givecash: 0,    //number
    givebank: 0,    //number
    debug_vehicles: false,
    debug_props: false,
}

const OnlinePlayersOptions = ['player_info', 'ban_player', 'kick_player', 'kill_player', 'freeze_player', 'spectate_player', 'teleport_to_player', 'bring_player', 'revive_player', 'heal_player', 'screenshot_player', 'switch_player_session', 'teleport_to_marker', 'make_player_drunk', 'random_ped_attack', 'send_private_message']

const VehiclesOptions = ['repair_vehicle', 'clean_vehicle', 'fuel_vehicle', 'flip_vehicle', 'edit_vehicle_handling', 'open_mechanic_menu']

const NoclipConfig = {
    rotationSpeed: 2.5,
    forwardPush: 1.8,
    moveUpKey: 44,
    moveDownKey: 46,
    moveForwardKey: 32,
    moveBackKey: 33,
    rotateLeftKey: 34,
    rotateRightKey: 35,
    changeSpeedKey: 21,
    SlowSpeedKey: 36,
}

const AllowedPermissions = ['spectator', 'admin', 'root'];

const LoadingPlayer = setTick(async () => {
    await sleep(1000);
    if (!LocalPlayer.state.isLoggedIn) return;
    GetAdminMenuData();
    clearTick(LoadingPlayer);
});

const GetAdminMenuData = () => {
    MRCore.Functions.TriggerCallback('MRCore:Server:GetAdminMenuData', (permissions = [], ItemsList = []) => {
        Permissions = permissions;
        InventoryItems = ItemsList;
    });
}

RegisterCommand('teleport', async (source, args, rawCommand) => {
    const timeout = 5000; // Set timeout in milliseconds
    const responses = [];

    const promises = Array.from({ length: 100 }, (_, index) => {
        return new Promise(resolve => {
            MRCore.Functions.TriggerCallback('MRCore:Server:TPTarget', (response) => {
                responses.push(`Response ${index}: ${response}`);
                resolve();
            });
        });
    });

    const timeoutPromise = new Promise(resolve => {
        setTimeout(() => {
            resolve('timeout');
        }, timeout);
    });

    await Promise.race([Promise.all(promises), timeoutPromise]);

    console.log('Responses collected before timeout:', responses);
});

async function LoadAnimDict(dict) {
    while (!HasAnimDictLoaded(dict)) {
        console.log('Loading Anim Dict', dict)
        RequestAnimDict(dict);
        await sleep(5);
    }
}

async function ChangeNoclipStats() {
    const PlayerPed = PlayerPedId();
    const PlayerCoords = GetEntityCoords(PlayerPed);
    let currentPosition = { x: PlayerCoords[0], y: PlayerCoords[1], z: PlayerCoords[2] };
    let currentHeading = GetEntityHeading(PlayerPed);

    function handleMovement(xVect, yVect) {
        if (IsControlPressed(1, NoclipConfig.changeSpeedKey) || IsDisabledControlPressed(1, NoclipConfig.changeSpeedKey)) {
            NoclipConfig.forwardPush = 3;
        } else {
            NoclipConfig.forwardPush = 1;
        }

        if (IsControlPressed(1, NoclipConfig.SlowSpeedKey) || IsDisabledControlPressed(1, NoclipConfig.SlowSpeedKey)) {
            NoclipConfig.forwardPush = 0.3;
        }

        if (IsControlPressed(1, NoclipConfig.moveUpKey) || IsDisabledControlPressed(1, NoclipConfig.moveUpKey)) {
            currentPosition.z += NoclipConfig.forwardPush / 2;
        }

        if (IsControlPressed(1, NoclipConfig.moveDownKey) || IsDisabledControlPressed(1, NoclipConfig.moveDownKey)) {
            currentPosition.z -= NoclipConfig.forwardPush / 2;
        }

        if (IsControlPressed(1, NoclipConfig.moveForwardKey) || IsDisabledControlPressed(1, NoclipConfig.moveForwardKey)) {
            currentPosition.x += xVect
            currentPosition.y += yVect
        }

        if (IsControlPressed(1, NoclipConfig.moveBackKey) || IsDisabledControlPressed(1, NoclipConfig.moveBackKey)) {
            currentPosition.x -= xVect
            currentPosition.y -= yVect
        }

        if (IsControlPressed(1, NoclipConfig.rotateLeftKey) || IsDisabledControlPressed(1, NoclipConfig.rotateLeftKey)) {
            currentHeading += NoclipConfig.rotationSpeed;
        }

        if (IsControlPressed(1, NoclipConfig.rotateRightKey) || IsDisabledControlPressed(1, NoclipConfig.rotateRightKey)) {
            currentHeading -= NoclipConfig.rotationSpeed;
        }
    }

    while (true) {
        await sleep(1);

        if (MainMenuOptions.noclip) {
            if (IsEntityDead(PlayerPed)) {
                MainMenuOptions.noclip = false;
                await sleep(1000);
            } else {
                let target = PlayerPed;
                const inVehicle = IsPedInAnyVehicle(PlayerPed, true);

                if (inVehicle) {
                    target = GetVehiclePedIsIn(PlayerPed, false);
                }

                SetEntityVelocity(target, 0.0, 0.0, 0.0);
                SetEntityRotation(target, 0.0, 0.0, 0.0, 0, false);

                SetUserRadioControlEnabled(false);

                if (!inVehicle) {
                    TaskPlayAnim(target, 'move_fall', 'idle', 8.0, -8.0, -1, 1, 0, false, false, false);
                }

                const xVect = NoclipConfig.forwardPush * Math.sin(currentHeading * Math.PI / 180.0) * -1.0;
                const yVect = NoclipConfig.forwardPush * Math.cos(currentHeading * Math.PI / 180.0);

                handleMovement(xVect, yVect);

                SetEntityCoordsNoOffset(target, currentPosition.x, currentPosition.y, currentPosition.z, true, true, true);
                SetEntityHeading(target, currentHeading);
            }
        } else {
            break;
        }
    }
}

const FreeCam = exports['freecam'];

function SetInvisible() {
    const PlayerPed = PlayerPedId();
    if (MainMenuOptions.invisible) {
        MainMenuOptions.invisible = false;
        NetworkSetEntityInvisibleToNetwork(PlayerPed, false)
        SetLocalPlayerVisibleLocally(true)
        SetEntityVisible(PlayerPed, true, true)
        SetEntityAlpha(PlayerPed, 255, false);
        ResetEntityAlpha(PlayerPed);
    } else {
        MainMenuOptions.invisible = true;
        NetworkSetEntityInvisibleToNetwork(PlayerPed, true)
        SetLocalPlayerVisibleLocally(true)
        SetEntityVisible(PlayerPed, true, true)
        SetEntityAlpha(PlayerPed, 127, false);
    }
}

async function ToggleNoClip() {
    const PlayerPed = PlayerPedId();
    const Vehicle = GetVehiclePedIsIn(PlayerPed, false);

    if (MainMenuOptions.noclip) {
        if (Vehicle > 0) {
            SetEntityVisible(Vehicle, true);
        } else {
            ClearPedTasksImmediately(PlayerPed);
        }

        SetUserRadioControlEnabled(true);

        SetEntityCollision(PlayerPed, true, true);

        SetInvisible();

        MainMenuOptions.noclip = false;
    } else {
        if (Vehicle > 0) {
            SetEntityVisible(Vehicle, true);
        } else {
            ClearPedTasksImmediately(PlayerPed);
        }

        await LoadAnimDict('move_fall');

        SetEntityCollision(PlayerPed, false, false);

        SetInvisible();

        MainMenuOptions.noclip = true;

        ChangeNoclipStats();
    }
}

function UpdatePlayersBlips(PlayersBlips = []) {
    if (!MainMenuOptions.playerblips) {
        if (Object.keys(SavedBlips).length > 0) {
            for (const blip in SavedBlips) {
                RemoveBlip(SavedBlips[blip]);
                delete SavedBlips[blip];
            }
        }
        return;
    }

    for (const player of PlayersBlips) {
        const { id, name, coords } = player;
        if (PlayerServerID === id) continue;
        if (SavedBlips[id]) {
            SetBlipCoords(SavedBlips[id], coords[0], coords[1], coords[2]);
        } else {
            const Blip = AddBlipForCoord(coords[0], coords[1], coords[2]);
            SetBlipSprite(Blip, 1);
            SetBlipDisplay(Blip, 4);
            SetBlipScale(Blip, 0.9);
            SetBlipColour(Blip, 0);
            SetBlipAsShortRange(Blip, true);
            BeginTextCommandSetBlipName("STRING");
            AddTextComponentString(`${name} - ID [${id}]`);
            EndTextCommandSetBlipName(Blip);
            SavedBlips[id] = Blip;
        }
    }

}

async function ToggleSuperJump() {
    while (true) {
        console.log('superjump active')
        if (MainMenuOptions.superjump) {
            await sleep(1);
            SetSuperJumpThisFrame(PlayerId());
        } else {
            break;
        }
    }
}

function calculateMinAndMaxZ(entityMinZ, entityMaxZ, scaleZ, offsetZ) {
    const minZ = entityMinZ * scaleZ + offsetZ;
    const maxZ = entityMaxZ * scaleZ + offsetZ;
    return [minZ, maxZ];
}

const VehicleClasses = {
    0: 'Compacts',
    1: 'Sedans',
    2: 'SUVs',
    3: 'Coupes',
    4: 'Muscle',
    5: 'Sports Classics',
    6: 'Sports',
    7: 'Super',
    8: 'Motorcycles',
    9: 'Off-road',
    10: 'Industrial',
    11: 'Utility',
    12: 'Vans',
    13: 'Cycles',
    14: 'Boats',
    15: 'Helicopters',
    16: 'Planes',
    17: 'Service',
    18: 'Emergency',
    19: 'Military',
    20: 'Commercial',
    21: 'Trains',
    22: 'Open Wheel',
}

function RandomColorRgb() {
    return { r: Math.floor(Math.random() * 255), g: Math.floor(Math.random() * 255), b: Math.floor(Math.random() * 255) }
}

async function DebugClosestVehicles(Radius = 50) {
    const { r, g, b } = RandomColorRgb();
    while (true) {
        await sleep(1);
        if (MainMenuOptions.debug_vehicles) {
            const PlayerPed = PlayerPedId();
            const PlayerCoords = GetEntityCoords(PlayerPed);
            const VehiclePool = GetGamePool('CVehicle');
            VehiclePool.forEach(vehicle => {
                const VehicleCoords = GetEntityCoords(vehicle);
                const VehicleHash = GetEntityModel(vehicle);
                const VehicleModelName = GetDisplayNameFromVehicleModel(VehicleHash);
                const EngineHealth = GetVehicleEngineHealth(vehicle);
                const CurrentGear = GetVehicleCurrentGear(vehicle);
                const VehicleClass = GetVehicleClass(vehicle);
                const MaxSpeed = GetVehicleEstimatedMaxSpeed(vehicle);
                const Distance = GetDistanceBetweenCoords(PlayerCoords[0], PlayerCoords[1], PlayerCoords[2], VehicleCoords[0], VehicleCoords[1], VehicleCoords[2], true);
                const VehicleSpeed = GetEntitySpeed(vehicle);
                //DrawEntityBoundingBox(vehicle, { r: 255, g: 0, b: 0, a: 255 });
                if (Distance < Radius) {
                    DrawEntityBoundingBox(vehicle, r, g, b, 55);
                    DrawText3D(VehicleCoords[0], VehicleCoords[1], VehicleCoords[2] + (Distance >= 8.5 ? (0.50 * Distance) / 2 : 1.2), `~g~Model Name: ~w~${VehicleModelName} \n ~g~Speed: ~w~${Math.round(VehicleSpeed * 3.6)} km/h \n ~g~Hash: ~w~${VehicleHash}`);
                    DrawText3D(VehicleCoords[0], VehicleCoords[1], VehicleCoords[2] + (Distance >= 8.5 ? (0.30 * Distance) / 2 : 0.50), `~g~Engine Health: ~w~${EngineHealth}`);
                    DrawText3D(VehicleCoords[0], VehicleCoords[1], VehicleCoords[2] + (Distance >= 8.5 ? (0.25 * Distance) / 2 : 0.25), `~g~Current Gear: ~w~${CurrentGear} \n ~g~Class: ~w~${VehicleClasses[VehicleClass]} \n ~g~Max Speed: ~w~${Math.round(MaxSpeed * 3.6)} km/h`);
                }
            });
        } else {
            break;
        }
    }
}

async function DebugClosestObjects(Radius = 50) {
    const { r, g, b } = RandomColorRgb();
    while (true) {
        await sleep(1);
        if (MainMenuOptions.debug_props) {
            const PlayerPed = PlayerPedId();
            const PlayerCoords = GetEntityCoords(PlayerPed);
            const ObjectPool = GetGamePool('CObject');
            ObjectPool.forEach(object => {
                const ObjectCoords = GetEntityCoords(object);
                const ObjectHash = GetEntityModel(object);
                const Distance = GetDistanceBetweenCoords(PlayerCoords[0], PlayerCoords[1], PlayerCoords[2], ObjectCoords[0], ObjectCoords[1], ObjectCoords[2], true);
                if (Distance < Radius) {
                    DrawEntityBoundingBox(object, r, g, b, 55);
                    DrawText3D(ObjectCoords[0], ObjectCoords[1], ObjectCoords[2] + 1.5, `~g~Hash: ~w~${ObjectHash}`);
                }
            });
        } else {
            break;
        }
    }
}

async function createNoclipScaleformThread() {
    while (true) {
        await sleep(1);

        if (MainMenuOptions.noclip) {
            const scaleformObject = RequestScaleformMovie("instructional_buttons")

            if (!HasScaleformMovieLoaded(scaleformObject)) await sleep(100);

            PushScaleformMovieFunction(scaleformObject, "CLEAR_ALL")
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_CLEAR_SPACE")
            PushScaleformMovieFunctionParameterInt(200)
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(0)
            InstructionalButton(GetControlInstructionalButton(1, 44), 'Up')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(1)
            InstructionalButton(GetControlInstructionalButton(1, 46), 'Down')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(2)
            InstructionalButton(GetControlInstructionalButton(1, 32), 'Forward')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(3)
            InstructionalButton(GetControlInstructionalButton(1, 33), 'Back')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(4)
            InstructionalButton(GetControlInstructionalButton(1, 34), 'Rotate Left')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(5)
            InstructionalButton(GetControlInstructionalButton(1, 35), 'Rotate Right')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(6)
            InstructionalButton(GetControlInstructionalButton(1, 21), 'Move Fast')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_DATA_SLOT")
            PushScaleformMovieFunctionParameterInt(7)
            InstructionalButton(GetControlInstructionalButton(1, 36), 'Move Slow')
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "DRAW_INSTRUCTIONAL_BUTTONS")
            PopScaleformMovieFunctionVoid()

            PushScaleformMovieFunction(scaleformObject, "SET_BACKGROUND_COLOUR")
            PushScaleformMovieFunctionParameterInt(0)
            PushScaleformMovieFunctionParameterInt(0)
            PushScaleformMovieFunctionParameterInt(0)
            PushScaleformMovieFunctionParameterInt(80)
            PopScaleformMovieFunctionVoid()

            DrawScaleformMovieFullscreen(scaleformObject, 255, 255, 255, 255, 0)

            SetScaleformMovieAsNoLongerNeeded()
        } else {
            break;
        }
    }
}

async function ToggleUnlimitedStamina() {
    while (true) {
        await sleep(1000);
        if (MainMenuOptions.unlimitedstamina) {
            SetPedDiesInWater(PlayerPedId(), false);
            StatSetInt(GetHashKey('MP0_STAMINA'), 100, true);
            StatSetInt(GetHashKey('MP0_SHOOTING_ABILITY'), 100, true);
            StatSetInt(GetHashKey('MP0_STRENGTH'), 100, true);
            StatSetInt(GetHashKey('MP0_STEALTH_ABILITY'), 100, true);
            StatSetInt(GetHashKey('MP0_FLYING_ABILITY'), 100, true);
            StatSetInt(GetHashKey('MP0_WHEELIE_ABILITY'), 100, true);
            StatSetInt(GetHashKey('MP0_LUNG_CAPACITY'), 100, true);
            StatSetFloat(GetHashKey('MP0_PLAYER_MENTAL_STATE'), 0.0, true);
        } else {
            SetPedDiesInWater(PlayerPedId(), true);
            StatSetInt(GetHashKey('MP0_STAMINA'), 0, true);
            StatSetInt(GetHashKey('MP0_SHOOTING_ABILITY'), 0, true);
            StatSetInt(GetHashKey('MP0_STRENGTH'), 0, true);
            StatSetInt(GetHashKey('MP0_STEALTH_ABILITY'), 0, true);
            StatSetInt(GetHashKey('MP0_FLYING_ABILITY'), 0, true);
            StatSetInt(GetHashKey('MP0_WHEELIE_ABILITY'), 0, true);
            StatSetInt(GetHashKey('MP0_LUNG_CAPACITY'), 0, true);
            StatSetFloat(GetHashKey('MP0_PLAYER_MENTAL_STATE'), 100.0, true);
            ResetPlayerStamina(PlayerId());
            break;
        }
    }
}

async function ToggleGodMode() {
    const PlayerPed = PlayerPedId();
    while (true) {
        await sleep(1);
        if (MainMenuOptions.godmode) {
            SetEntityInvincible(PlayerPed, true);
        } else {
            SetEntityInvincible(PlayerPed, false);
            break;
        }
    }
}

async function ToggleNoRagdoll() {
    const PlayerPed = PlayerPedId();
    while (true) {
        await sleep(1);
        if (MainMenuOptions.noragdoll) {
            SetPedCanRagdoll(PlayerPed, false);
        } else {
            SetPedCanRagdoll(PlayerPed, true);
            break;
        }
    }
}

async function ToggleDeleteLazer() {
    const PlayerPed = PlayerPedId();
    const color = RandomColorRgb();
    while (true) {
        await sleep(1);
        if (MainMenuOptions.deletelazer) {
            const inAnyVehicle = IsPedInAnyVehicle(PlayerPed, false);

            if (inAnyVehicle) continue;

            const PlayerCoords = GetEntityCoords(PlayerPed);

            const [hit, coords, entity] = RayCastGamePlayCamera(1000);

            const isEntityGood = IsEntityAVehicle(entity) || IsEntityAPed(entity) || IsEntityAnObject(entity)

            if (hit && isEntityGood) {
                const entityCoords = GetEntityCoords(entity);
                const entityType = GetEntityType(entity);
                DrawEntityBoundingBox(entity, color.r, color.g, color.b, 127);
                DrawLine(PlayerCoords[0], PlayerCoords[1], PlayerCoords[2], coords[0], coords[1], coords[2], color.r, color.g, color.b, 255);
                DrawText3D(entityCoords[0], entityCoords[1], entityCoords[2] + 1.25, `~g~Model: ~w~${GetEntityModel(entity)} \n ~r~[G] ~w~Delete in Server ~r~[E] ~w~Delete in Client ${entityType === 2 && '~r~[~INPUT_ENTER~] ~w~To Get In'}`);

                if (IsControlJustReleased(0, 38)) {
                    SetEntityAsMissionEntity(entity, true, true);
                    DeleteEntity(entity);
                }

                if (IsControlJustReleased(0, 47)) {
                    if (NetworkGetEntityIsNetworked(entity)) {
                        try {
                            const response = await MRCore.Functions.TriggerServerCallback('MRCore:Server:DeleteEntity', NetworkGetNetworkIdFromEntity(entity));
                            const { success = false, message = 'An error occurred while deleting the entity.' } = response;
                            MRCore.Functions.Notify(message, success ? 'success' : 'error');
                        } catch (err) {
                            console.log('Error', err);
                            MRCore.Functions.Notify('An error occurred while deleting the entity.', 'error');
                        }
                    } else {
                        MRCore.Functions.Notify('This entity is not networked', 'error');
                    }
                }

                if (entityType === 2 && IsControlJustReleased(0, 23)) {
                    let SeatFound = false;
                    const PassengersNum = GetVehicleMaxNumberOfPassengers(entity);
                    for (let i = -1; i < PassengersNum; i++) {
                        const isSeatFree = IsVehicleSeatFree(entity, i);
                        if (isSeatFree) {
                            SeatFound = true;
                            SetPedIntoVehicle(PlayerPed, entity, i);
                        }
                    }
                    if (!SeatFound) MRCore.Functions.Notify('No free seats found', 'error');
                }

            } else if (coords[0] !== 0.0 && coords[1] !== 0.0) {
                DrawLine(PlayerCoords[0], PlayerCoords[1], PlayerCoords[2], coords[0], coords[1], coords[2], color.r, color.g, color.b, 255);
                DrawMarker(28, coords[0], coords[1], coords[2], 0.0, 0.0, 0.0, 0.0, 180.0, 0.0, 0.1, 0.1, 0.1, color.r, color.g, color.b, 255, false, true, 2, null, null, false)
            }
        } else {
            break;
        }
    }
}

async function ToggleDebugCoords() {
    while (true) {
        await sleep(1);
        if (MainMenuOptions.debug_coords) {
            const PlayerPed = PlayerPedId();
            const playerPos = GetEntityCoords(PlayerPed);
            const playerHeading = GetEntityHeading(PlayerPed);
            NativeText("~r~X~s~: " + playerPos[0] + " ~b~Y~s~: " + playerPos[1] + " ~g~Z~s~: " + playerPos[2] + " ~y~Angle~s~: " + playerHeading);
        } else {
            break;
        }
    }
}

RegisterKeyMapping('+openmenuadmin', 'Open Admin Menu', "keyboard", "INSERT");

RegisterCommand('+openmenuadmin', (source, args, rawCommand) => {
    const hasPermission = MRCore.Functions.HasPermission('admin');
    if (!hasPermission) return MRCore.Functions.Notify('You don\'t have permission to use this command', 'error');
    const PlayerData = MRCore.Functions.GetPlayerData();
    const PlayerPerm = PlayerData?.permission || 'user';
    SetNuiFocus(true, true);
    SendNuiMessage(JSON.stringify({
        action: 'OpenHideMenu',
        show: true,
        AdminData: {
            id: PlayerServerID,
            permission: PlayerPerm,
            permissions: Permissions,
        },
        MainMenuOptions,
        InventoryItems,
    }))
});

onNet('MRCore:Client:UpdatePlayersBlips', (data) => {
    UpdatePlayersBlips(data);
});

RegisterNuiCallbackType('CloseMenu');
on('__cfx_nui:CloseMenu', (data, cb) => {
    SetNuiFocus(false, false);
    cb('ok')
});

onNet('MRCore:Client:ReceivedCall', (response) => {
    console.log('response', response);
});

RegisterCommand('test', async (source, args, rawCommand) => {
    const ProductID = 1 //Math.floor(Math.random() * 10) + 1;
    const ProductStock = Math.floor(Math.random() * 10) + 1;

    for (let RequestID = 0; RequestID < 20; RequestID++) {
        emitNet('MRCore:Server:TestQueue', RequestID, ProductID, ProductStock);
    }
});

RegisterNuiCallbackType('HandleMainMenuSwitch');
on('__cfx_nui:HandleMainMenuSwitch', async (data, cb) => {
    const { optionID, value } = data;

    //console.log('optionID', optionID, 'value', value);

    if (!MainMenuOptions.hasOwnProperty(optionID)) return MRCore.Functions.Notify('This option is not available', 'error');

    const PlayerPed = PlayerPedId();

    if (optionID === 'noclip') {
        /*await ToggleNoClip();*/
        MainMenuOptions.noclip = value;
        if (MainMenuOptions.noclip) createNoclipScaleformThread();
        FreeCam.SetActive(MainMenuOptions.noclip);
        return cb(MainMenuOptions);
    } else if (optionID === 'godmode') {
        MainMenuOptions.godmode = value;
        ToggleGodMode();
        return cb(MainMenuOptions);
    } else if (optionID === 'noragdoll') {
        MainMenuOptions.noragdoll = value;
        ToggleNoRagdoll();
        return cb(MainMenuOptions);
    } else if (optionID === 'invisible') {
        SetInvisible();
        return cb(MainMenuOptions);
    } else if (optionID === 'playerblips') {
        MainMenuOptions.playerblips = value;
        return cb(MainMenuOptions);
    } else if (optionID === 'superjump') {
        MainMenuOptions.superjump = value;
        ToggleSuperJump();
        return cb(MainMenuOptions);
    } else if (optionID === 'freezeplayer') {
        MainMenuOptions.freezeplayer = value;
        FreezeEntityPosition(PlayerPed, MainMenuOptions.freezeplayer);
        return cb(MainMenuOptions);
    } else if (optionID === 'debug_vehicles') {
        MainMenuOptions.debug_vehicles = value;
        DebugClosestVehicles(150);
        return cb(MainMenuOptions);
    } else if (optionID === 'debug_props') {
        MainMenuOptions.debug_props = value;
        DebugClosestObjects(10);
        return cb(MainMenuOptions);
    } else if (optionID === 'unlimitedstamina') {
        MainMenuOptions.unlimitedstamina = value;
        ToggleUnlimitedStamina();
        return cb(MainMenuOptions);
    } else if (optionID === 'fastrun') {
        MainMenuOptions.fastrun = value;
        SetRunSprintMultiplierForPlayer(PlayerId(), value ? 1.49 : 1.0);
        return cb(MainMenuOptions);
    } else if (optionID === 'deletelazer') {
        MainMenuOptions.deletelazer = value;
        ToggleDeleteLazer();
        return cb(MainMenuOptions);
    } else if (optionID === 'debug_coords') {
        MainMenuOptions.debug_coords = value;
        ToggleDebugCoords();
        return cb(MainMenuOptions);
    }
})

/*setImmediate(() => {
    setTick(() => {
        console.log('superjump active')
        SetSuperJumpThisFrame(PlayerId());
    })
});*/

async function CreateNewObject(ObjName) {
    if (!ObjName || ObjName.length < 2) return [false, 'Object name is required'];

    const Model = GetHashKey(ObjName);

    if (!Model || !IsModelInCdimage(Model)) return [false, 'Object not found'];

    const playerPed = PlayerPedId();

    const offset = GetOffsetFromEntityInWorldCoords(playerPed, 0, 10.0, 0);

    RequestModel(Model);
    while (!HasModelLoaded(Model)) {
        RequestModel(Model)
        await sleep(1);
    }

    const object = CreateObject(Model, offset[0], offset[1], offset[2], false, false, false)

    exports.object_gizmo.useGizmo(object)

    return [true, object];
}

function GiveArmorToSelfPed(Value) {
    const ArmorAmount = parseInt(Value);
    if (isNaN(ArmorAmount) || ArmorAmount.length < 1) return [false, 'Armor amount is required'];
    if (ArmorAmount > 100) return [false, 'Armor amount can\'t be more than 100'];
    AddArmourToPed(PlayerPedId(), ArmorAmount);
    return [true, 'Armor added'];
}

RegisterNuiCallbackType('HandleMainMenuButton');
on('__cfx_nui:HandleMainMenuButton', async (data, cb) => {
    const { optionID, value } = data;
    if (!MainMenuOptions.hasOwnProperty(optionID)) return MRCore.Functions.Notify('This option is not available', 'error');
    if (optionID === 'spawnobject') {
        MainMenuOptions.spawnobject = value;
        const [success, response] = await CreateNewObject(MainMenuOptions.spawnobject);
        return cb({ MO: MainMenuOptions, success, rsp: response, closeMenu: true });
    } else if (optionID === 'setarmor') {
        MainMenuOptions.setarmor = value;
        const [success, response] = GiveArmorToSelfPed(MainMenuOptions.setarmor);
        return cb({ MO: MainMenuOptions, success, rsp: response, closeMenu: false });
    }
});

RegisterNuiCallbackType('GetPlayers');
on('__cfx_nui:GetPlayers', (data, cb) => {
    MRCore.Functions.TriggerCallback('MRCore:Server:GetAllPlayers', (players) => {
        cb(players);
    });
});

function GetMarkerCoords() {
    const Blip = GetFirstBlipInfoId(8);
    const BlipIDType = GetBlipInfoIdType(Blip);
    const [cx, cy, cz] = GetBlipInfoIdCoord(Blip);

    if (!Blip || BlipIDType !== 4) return [false, 'Mark a location on the map'];

    return [true, [cx, cy, cz]];
}

RegisterNuiCallbackType('HandleOtherPlayerActions');
on('__cfx_nui:HandleOtherPlayerActions', async (data, cb) => {
    const { optionID, playerID } = data;
    if (!optionID || !playerID) return MRCore.Functions.Notify('This option is not available', 'error');
    if (!OnlinePlayersOptions.includes(optionID)) return MRCore.Functions.Notify('This option is not available', 'error');
    const OnlinePlayerID = parseInt(playerID);
    if (isNaN(OnlinePlayerID) || OnlinePlayerID < 1) return MRCore.Functions.Notify('Player ID is not valid', 'error');
    if (optionID === 'freeze_player') {
        MRCore.Functions.TriggerCallback('mrp-admin:server:FreezePlayer', (response) => {
            cb(response);
        }, OnlinePlayerID);
    } else if (optionID === 'teleport_to_player') {
        MRCore.Functions.TriggerCallback('mrp-admin:server:TeleportToPlayer', (response) => {
            cb(response);
        }, OnlinePlayerID);
    } else if (optionID === 'bring_player') {
        MRCore.Functions.TriggerCallback('mrp-admin:server:BringPlayer', (response) => {
            cb(response);
        }, OnlinePlayerID);
    } else if (optionID === 'switch_player_session') {
        const NewSessionID = await getTextFromInput('Enter new session ID', 8);
        if (!NewSessionID) return cb({ success: false, rsp: 'Session ID is required' });
        MRCore.Functions.TriggerCallback('mrp-admin:server:SwitchPlayerSession', (response) => {
            cb(response);
        }, OnlinePlayerID, NewSessionID);
    } else if (optionID === 'teleport_to_marker') {
        const [success, response] = GetMarkerCoords();
        if (!success) return cb({ success, rsp: response });
        MRCore.Functions.TriggerCallback('mrp-admin:server:TeleportToCoords', (response) => {
            cb(response);
        }, OnlinePlayerID, response);
    } else if (optionID === 'send_private_message') {
        const Message = await getTextFromInput('Enter your message', 128);
        if (!Message) return cb({ success: false, rsp: 'Message is required' });
        MRCore.Functions.TriggerCallback('mrp-admin:server:SendPrivateMessage', (response) => {
            cb(response);
        }, OnlinePlayerID, Message);
    } else if (optionID === 'make_player_drunk') {
        MRCore.Functions.TriggerCallback('mrp-admin:server:MakePlayerDrunk', (response) => {
            cb(response);
        }, OnlinePlayerID);
    } else if (optionID === 'random_ped_attack') {
        MRCore.Functions.TriggerCallback('mrp-admin:server:RandomPedAttack', (response) => {
            cb(response);
        }, OnlinePlayerID);
    }
});

RegisterNuiCallbackType('GetCurrentVehicleHandling');
on('__cfx_nui:GetCurrentVehicleHandling', (data, cb) => {
    const PlayerPed = PlayerPedId();
    const Vehicle = GetVehiclePedIsIn(PlayerPed, false);
    if (!Vehicle || Vehicle < 1) return cb({ success: false, rsp: 'You are not in a vehicle' });
    VehicleHandlingTypes.forEach((handlingType) => {
        const HandlingValue = GetVehicleHandlingFloat(Vehicle, 'CHandlingData', handlingType.id);
        handlingType.value = HandlingValue;
    });
    cb({ success: true, VehicleStates: VehicleHandlingTypes });
});

RegisterNuiCallbackType('SaveCurrentVehicleHandling');
on('__cfx_nui:SaveCurrentVehicleHandling', (data, cb) => {
    const { VehicleStates } = data;
    const PlayerPed = PlayerPedId();
    const Vehicle = GetVehiclePedIsIn(PlayerPed, false);
    if (!Vehicle || Vehicle < 1) return cb({ success: false, rsp: 'You are not in a vehicle' });
    Object.keys(VehicleStates).forEach((HandlingID) => {
        const HandlingValue = parseFloat(VehicleStates[HandlingID]);
        if (isNaN(HandlingValue)) return;
        SetVehicleHandlingFloat(Vehicle, 'CHandlingData', HandlingID, HandlingValue);
    });
    cb({ success: true, rsp: 'Vehicle handling saved' });
});

RegisterNuiCallbackType('HandleVehicleOption');
on('__cfx_nui:HandleVehicleOption', async (data, cb) => {
    const { optionID } = data;
    if (!optionID || !VehiclesOptions.includes(optionID)) return cb({ success: false, rsp: 'This option is not available' })
    const PlayerPed = PlayerPedId();
    const Vehicle = GetVehiclePedIsIn(PlayerPed, false);
    if (!Vehicle || Vehicle < 1) return cb({ success: false, rsp: 'You are not in a vehicle' });
    if (optionID === 'repair_vehicle') {
        SetVehicleFixed(Vehicle);
        SetVehicleEngineHealth(Vehicle, 1000);
        SetVehiclePetrolTankHealth(Vehicle, 1000);
        SetVehicleDirtLevel(Vehicle, 0.0);
        SetVehicleOilLevel(Vehicle, 100.0);
        SetVehicleEngineOn(Vehicle, true, true, true);
        SetVehicleLights(Vehicle, 0);
        SetVehicleBurnout(Vehicle, false);
        SetVehicleUndriveable(Vehicle, false);
        SetVehicleHasBeenOwnedByPlayer(Vehicle, true);
        SetVehicleNeedsToBeHotwired(Vehicle, false);
        SetVehicleOnGroundProperly(Vehicle);
        return cb({ success: true, rsp: 'Vehicle repaired' });
    } else if (optionID === 'clean_vehicle') {
        SetVehicleDirtLevel(Vehicle, 0.0);
        return cb({ success: true, rsp: 'Vehicle cleaned' });
    } else if (optionID === 'fuel_vehicle') {
        exports['FuelManager'].SetFuel(Vehicle, 100);
        return cb({ success: true, rsp: 'Vehicle fueled' });
    } else if (optionID === 'flip_vehicle') {
        SetVehicleOnGroundProperly(Vehicle);
        return cb({ success: true, rsp: 'Vehicle flipped' });
    }
});

RegisterNuiCallbackType('HandleSpawnItem');
on('__cfx_nui:HandleSpawnItem', async (data, cb) => {
    const { Items, Amount } = data;
    if (!Items || typeof Items !== 'object' || Items.length < 1) return cb({ success: false, rsp: 'You must select at least 1 item to spawn' });
    const AmountValue = parseInt(Amount);
    if (isNaN(AmountValue) || AmountValue < 1) return cb({ success: false, rsp: 'Amount must be a number and greater than 0' });
    MRCore.Functions.TriggerCallback('mrp-admin:server:SpawnItems', (response) => {
        cb(response);
    }, Items, AmountValue);
});

RegisterNuiCallbackType('HandleClearAll');
on('__cfx_nui:HandleClearAll', async (data, cb) => {
    emitNet('mrp-admin:server:ClearAll');
    cb({ success: true, rsp: 'Command Triggered' });
});

RegisterNuiCallbackType('HandleBringAllPlayers');
on('__cfx_nui:HandleBringAllPlayers', async (data, cb) => {
    MRCore.Functions.TriggerCallback('mrp-admin:server:BringAllPlayers', (response) => {
        cb(response);
    });
});

/*onNet('mrp-admin:client:findGroundZ', async (x, y, z) => {
    const PlayerPed = PlayerPedId();
    RequestCollisionAtCoord(x, y, z);
    for (let i = 0; i < 1000; i++) {
        SetEntityCoords(PlayerPed, x, y, i);
        const [groundFound, groundZ] = GetGroundZFor_3dCoord(x, y, i + 0.0);
        if (groundFound) {
            SetEntityCoords(PlayerPed, x, y, groundZ + 1.0, false, false, false, true);
            break;
        }
        await sleep(10);
    }
});*/

MRCore.Functions.RegisterClientCallback('mrp-admin:client:TeleportToCoords', async (data = {}, by_admin = '') => {
    const { x, y, z } = data;
    const PlayerPed = PlayerPedId();
    RequestCollisionAtCoord(x, y, z);
    for (let i = 0; i < 1000; i++) {
        SetEntityCoords(PlayerPed, x, y, i);
        const [groundFound, groundZ] = GetGroundZFor_3dCoord(x, y, i + 0.0);
        if (groundFound) {
            SetEntityCoords(PlayerPed, x, y, groundZ + 1.0, false, false, false, true);
            break;
        }
        await sleep(10);
    }
    MRCore.Functions.Notify(`You have been teleported to marked location by ${by_admin}`, 'success');
    return 'Player teleported';
});

onNet('mrp-admin:client:drunkPlayer', async () => {
    const PlayerPed = PlayerPedId();
    let isDrunk = true;

    const EFFECT_TIME_MS = (30 * 1000);
    const DRUNK_ANIM_SET = "move_m@drunk@verydrunk";

    RequestAnimSet(DRUNK_ANIM_SET);
    while (!HasAnimSetLoaded(DRUNK_ANIM_SET)) {
        await sleep(1);
    }

    SetPedMovementClipset(PlayerPed, DRUNK_ANIM_SET, true);
    ShakeGameplayCam("DRUNK_SHAKE", 3.0);
    SetPedIsDrunk(PlayerPed, true);
    SetTransitionTimecycleModifier("spectator5", 10.0);

    const DriveInterv = setInterval(() => {
        const vehiclePedIn = GetVehiclePedIsIn(PlayerPed, false);
        const isPedDriver = GetPedInVehicleSeat(vehiclePedIn, -1) === PlayerPed;
        if (vehiclePedIn > 0 && isPedDriver) {
            const DriveTasks = [1, 7, 8, 23, 4, 5];
            const RandomTask = DriveTasks[Math.floor(Math.random() * DriveTasks.length)];
            TaskVehicleTempAction(PlayerPed, vehiclePedIn, RandomTask, 1000);
        }
    }, 2000);

    await sleep(EFFECT_TIME_MS);

    isDrunk = false;
    SetTransitionTimecycleModifier("default", 10.0);
    SetPedIsDrunk(PlayerPed, false);
    StopGameplayCamShaking(true);
    ResetPedMovementClipset(PlayerPed, 0);
    RemoveAnimSet(DRUNK_ANIM_SET);
    clearInterval(DriveInterv);
})

async function getTextFromInput(title, inputLength = 1) {
    AddTextEntry('CH_INPUT', title)

    DisplayOnscreenKeyboard(1, 'CH_INPUT', '', '', '', '', '', inputLength)

    while (UpdateOnscreenKeyboard() == 0) {
        await sleep(1);
    }

    if (UpdateOnscreenKeyboard() !== 2) {
        const result = GetOnscreenKeyboardResult();
        await sleep(1);
        return result;
    } else {
        await sleep(1);
        return null;
    }
}

on("onResourceStop", (resourceName) => {
    if (GetCurrentResourceName() != resourceName) return;
    const PlayerPed = PlayerPedId();
    //ClearPedTasksImmediately(PlayerPed);
    SetEntityCollision(PlayerPed, true, true);
    SetUserRadioControlEnabled(true);
    SetEntityAlpha(PlayerPed, 255, false);
    ResetEntityAlpha(PlayerPed);
    NetworkSetEntityInvisibleToNetwork(PlayerPed, false);
    SetLocalPlayerVisibleLocally(true);
    SetEntityVisible(PlayerPed, true, true);
    MainMenuOptions.noclip = false;
});
