const MRCore = exports['PHOENIX-RP'].GetCoreObject();

MRCore.Functions.ConsoleLog('[MRP-ADMIN] - Started');

const AvailablePermissions = MRCore.Config.Server.AvailablePermissions;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FreezedPlayers = {};

//MRCore.Commands.Add(name, help, arguments, argsrequired, callback, permission);

MRCore.Commands.Add('ChangePlayerSession', 'Change player session', [{ name: 'player', help: 'Player ID' }, { name: 'session', help: 'Session ID' }], true, (src, args) => {
    const PlayerID = parseInt(args[0]);
    const SessionID = parseInt(args[1]);
    if (isNaN(PlayerID) || isNaN(SessionID)) return MRCore.Functions.Notify(src, 'Invalid params', 'error', 3500);
    if (SessionID < 0 || SessionID > 2000) return MRCore.Functions.Notify(src, 'Invalid session', 'error', 3500);
    const TargetPed = GetPlayerPed(PlayerID);
    if (PlayerID < 0 || !DoesEntityExist(TargetPed)) return MRCore.Functions.Notify(src, 'Player not found', 'error', 3500);
    const PlayerCurrentSession = GetPlayerRoutingBucket(PlayerID);
    if (PlayerCurrentSession == SessionID) return MRCore.Functions.Notify(src, 'Player already in this session', 'error', 3500);
    SetPlayerRoutingBucket(PlayerID, SessionID);
}, 'root');

MRCore.Commands.Add('EnableSessionPopulation', 'Enable session population', [{ name: 'session', help: 'Session ID' }, { name: 'enable', help: 'Enable/Disable' }], true, (src, args) => {
    const SessionID = parseInt(args[0]);
    const Enable = args[1] === 'true';
    if (isNaN(SessionID) || SessionID < 0) return MRCore.Functions.Notify(src, 'Invalid session', 'error', 3500);
    SetRoutingBucketPopulationEnabled(SessionID, Enable);
    emitNet('MRCore:Notify', src, `Session ${SessionID} population ${Enable ? 'enabled' : 'disabled'}`, 'success', 3500);
}, 'root');

MRCore.Functions.CreateCallback('MRCore:Server:GetAdminMenuData', (source, cb) => {
    try {
        const ItemsList = exports['inventory_v2'].GetItemsList();
        cb(source, AvailablePermissions, ItemsList);
    } catch (err) {
        cb(source, AvailablePermissions, [])
    }
});

MRCore.Functions.CreateCallback('MRCore:Server:TPTarget', (source, cb) => {
    const src = source;
    const PlayerPed = GetPlayerPed(src);
    const [x, y, z] = GetEntityCoords(PlayerPed);
    console.log('TPTarget', x, y, z);
    cb([x, y, z]);
});

/*MRCore.Functions.CreateCallback('MRCore:Server:DeleteEntity', (source, cb, entityNetID) => {
    const src = source;
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb(false);
    if (!entityNetID) return cb(false);
    const EntityObj = NetworkGetEntityFromNetworkId(entityNetID);
    if (!EntityObj || !DoesEntityExist(EntityObj)) return cb(false);
    DeleteEntity(EntityObj);
    cb(true);
});*/

MRCore.Functions.RegisterServerCallBack('MRCore:Server:DeleteEntity', async (source, entityNetID = 0) => {
    const src = source;
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return { success: false, message: 'You dont have permission to use this command' };
    if (!entityNetID || typeof entityNetID !== 'number' || isNaN(entityNetID)) return { success: false, message: 'Invalid entity' };
    const EntityObj = NetworkGetEntityFromNetworkId(entityNetID);
    if (!EntityObj || !DoesEntityExist(EntityObj)) return { success: false, message: 'Entity not found' };
    const EntityType = GetEntityType(EntityObj);
    DeleteEntity(EntityObj);
    const TypesOfEntities = {
        1: 'Ped',
        2: 'Vehicle',
        3: 'Object',
    }
    return { success: true, message: `${TypesOfEntities[EntityType] || 'Entity'} deleted` };
});

MRCore.Functions.CreateCallback('MRCore:Server:GetAllPlayers', async function (source, cb) {
    const players = MRCore.Functions.GetPlayers();
    const PlayersList = Object.keys(players).map(key => {
        //if (key == source) return;
        const PlayerData = players[key]['PlayerData'];
        const CharInfo = PlayerData['charinfo'];
        const MoneyInfo = PlayerData['money'];
        const CharFullName = CharInfo['firstname'] + ' ' + CharInfo['lastname'];
        const CharCash = MoneyInfo['cash'];
        const CharBank = MoneyInfo['bank'];
        const CitizenID = PlayerData['citizenid'];
        const JobName = PlayerData['job']['label'];
        const JobGrade = PlayerData?.job?.grade?.label || 'No Grade';
        const JobSalary = PlayerData['job']['payment'];
        const DiscordInfo = PlayerData['discordInfo'];
        const PlayerRouting = GetPlayerRoutingBucket(key);
        const PlayerPermission = MRCore.Functions.GetPermission(key);
        return {
            id: key,
            session: PlayerRouting,
            name: GetPlayerName(key),
            ping: GetPlayerPing(key) + ' ms',
            ip: GetPlayerEndpoint(key),
            charName: CharFullName,
            moneyCash: CharCash,
            moneyBank: CharBank,
            citizenID: CitizenID,
            jobName: JobName,
            jobGrade: JobGrade,
            jobSalary: JobSalary,
            discordID: DiscordInfo['id'],
            discordAvatar: DiscordInfo['avatar'],
            discordUsername: DiscordInfo['username'],
            discordRoles: DiscordInfo['rolesName'],
            Freezed: FreezedPlayers.hasOwnProperty(key),
            AvailablePermissions,
            PlayerPermission,
        }
    }).filter(Boolean);
    cb(PlayersList);
});

onNet('mrp-admin:server:ClearAll', async () => {
    const src = global.source;

    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");

    if (!HasPermission) return emitNet('MRCore:Notify', src, 'You dont have permission', 'error', 3500);

    for (let i = 0; i < 10; i++) {
        emitNet('MRCore:Notify:Simple', -1, 'Server will be cleared in ' + (10 - i) + ' seconds', 6, true, false);
        await sleep(1000);
    }

    const AllPeds = GetAllPeds();
    const AllVehicles = GetAllVehicles();
    const AllObjects = GetAllObjects();

    for (const Ped of AllPeds) {
        DeleteEntity(Ped);
    }

    for (const Vehicle of AllVehicles) {
        const PedInVehicle = GetPedInVehicleSeat(Vehicle, -1);
        if (IsPedAPlayer(PedInVehicle)) continue;
        DeleteEntity(Vehicle);
    }

    for (const Object of AllObjects) {
        DeleteEntity(Object);
    }

    return emitNet('MRCore:Notify:Simple', -1, 'Server cleared by ' + GetPlayerName(src), 184, true, true);
});

MRCore.Functions.CreateCallback('mrp-admin:server:BringAllPlayers', async function (source, cb) {
    const src = source;

    const PlayerPed = GetPlayerPed(src);

    const [x, y, z] = GetEntityCoords(PlayerPed);

    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");

    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });

    const AllPlayers = MRCore.Functions.GetPlayers();

    let TotalBringed = 0;

    for (const Player of Object.keys(AllPlayers)) {
        const TargetPed = GetPlayerPed(Player);
        if (!TargetPed || !DoesEntityExist(TargetPed) || TargetPed === PlayerPed) continue;
        SetEntityCoords(TargetPed, x, y, z, false, false, false, true);
        TotalBringed++;
    }

    cb({ success: TotalBringed > 0 ? true : false, rsp: TotalBringed > 0 ? `${TotalBringed} players bringed` : 'No Players to bring' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:FreezePlayer', async function (source, cb, target) {
    const src = source;
    const Player = MRCore.Functions.GetPlayer(target);
    if (!Player) return cb({ success: false, rsp: 'Player not found' });
    const PlayerPed = GetPlayerPed(Player.PlayerData.source);
    if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    if (FreezedPlayers.hasOwnProperty(Player.PlayerData.source)) {
        FreezeEntityPosition(PlayerPed, false);
        delete FreezedPlayers[Player.PlayerData.source];
        cb({ success: true, rsp: 'Player unfreezed' });
    } else {
        FreezeEntityPosition(PlayerPed, true);
        FreezedPlayers[Player.PlayerData.source] = true;
        cb({ success: true, rsp: 'Player freezed' });
    }
});

MRCore.Functions.CreateCallback('mrp-admin:server:TeleportToPlayer', async function (source, cb, target) {
    const src = source;
    const Player = MRCore.Functions.GetPlayer(target);
    if (!Player) return cb({ success: false, rsp: 'Player not found' });
    const PlayerPed = GetPlayerPed(Player.PlayerData.source);
    if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    const PlayerCoords = GetEntityCoords(PlayerPed);
    const AdminPed = GetPlayerPed(src);
    SetEntityCoords(AdminPed, PlayerCoords[0], PlayerCoords[1], PlayerCoords[2]);
    cb({ success: true, rsp: 'Teleported' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:BringPlayer', async function (source, cb, target) {
    const src = source;
    const Player = MRCore.Functions.GetPlayer(target);
    if (!Player) return cb({ success: false, rsp: 'Player not found' });
    const PlayerPed = GetPlayerPed(Player.PlayerData.source);
    if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    const AdminPed = GetPlayerPed(src);
    const PlayerCoords = GetEntityCoords(AdminPed);
    SetEntityCoords(PlayerPed, PlayerCoords[0], PlayerCoords[1], PlayerCoords[2]);
    cb({ success: true, rsp: 'Bringed' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:SwitchPlayerSession', async function (source, cb, target, session) {
    const sessionID = parseInt(session);
    if (isNaN(sessionID) || sessionID < 0 || sessionID > 64) return cb({ success: false, rsp: 'Invalid session' });
    const src = source;
    const Player = MRCore.Functions.GetPlayer(target);
    if (!Player) return cb({ success: false, rsp: 'Player not found' });
    const PlayerPed = GetPlayerPed(Player.PlayerData.source);
    if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    const PlayerSession = GetPlayerRoutingBucket(Player.PlayerData.source);
    if (PlayerSession == sessionID) return cb({ success: false, rsp: 'Player already in this session' });
    SetPlayerRoutingBucket(Player.PlayerData.source, sessionID);
    cb({ success: true, rsp: 'Session changed' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:TeleportToCoords', async function (source, cb, OnlinePlayerID, coords) {
    try {
        if (!OnlinePlayerID || !coords) return cb({ success: false, rsp: 'Invalid params' });
        const src = source;
        const Player = MRCore.Functions.GetPlayer(OnlinePlayerID);
        if (!Player) return cb({ success: false, rsp: 'Player not found' });
        const PlayerPed = GetPlayerPed(Player.PlayerData.source);
        if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
        const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
        if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
        const [x, y, z] = coords;
        if (!x || !y || !z) return cb({ success: false, rsp: 'Invalid coords' });
        const Coords = { x, y, z };
        const AdminName = GetPlayerName(src);
        const TPResponse = await MRCore.Functions.TriggerClientCallback(Player.PlayerData.source, 'mrp-admin:client:TeleportToCoords', 10000, Coords, AdminName);
        const Teleported = TPResponse !== null
        console.log('TPResponse', TPResponse);
        return cb({ success: Teleported, rsp: Teleported ? TPResponse : 'An error occured while trying to teleport the following player' });
    } catch (err) {
        console.log('TeleportToCoords Error', err);
        return cb({ success: false, rsp: 'An error occured while trying to teleport the following player' });
    }
});

MRCore.Functions.CreateCallback('mrp-admin:server:SendPrivateMessage', async function (source, cb, target, message) {
    if (!target || !message) return cb({ success: false, rsp: 'Invalid params' });
    if (message.length < 1) return cb({ success: false, rsp: 'Message too short' });
    if (message.length > 128) return cb({ success: false, rsp: 'Message too long' });
    const src = source;
    const Name = GetPlayerName(src);
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    emitNet('MRCore:Notify:Advanced', target, message, 140, Name, 'New Admin Message', 'CHAR_ARTHUR', 1);
    return cb({ success: true, rsp: 'Message sent' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:MakePlayerDrunk', async function (source, cb, target) {
    const src = source;
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    emitNet('mrp-admin:client:drunkPlayer', target);
    cb({ success: true, rsp: 'Player is in drunk mode now' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:RandomPedAttack', async function (source, cb, target) {
    if (!target) return cb({ success: false, rsp: 'Invalid params' });
    const src = source;
    const Player = MRCore.Functions.GetPlayer(target);
    if (!Player) return cb({ success: false, rsp: 'Player not found' });
    const PlayerPed = GetPlayerPed(Player.PlayerData.source);
    if (!PlayerPed || !DoesEntityExist(PlayerPed)) return cb({ success: false, rsp: 'Player not found' });
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    const EntityCoords = GetEntityCoords(PlayerPed);
    const EntityHeading = GetEntityHeading(PlayerPed);
    const PedsList = ['u_m_y_babyd', 'a_c_boar', 'a_c_chimp', 's_m_m_movalien_01', 's_m_m_movspace_01', 'ig_orleans'];
    const WeaponsList = ['weapon_navyrevolver', 'weapon_raycarbine', 'weapon_gadgetpistol', 'weapon_musket', 'weapon_dbshotgun', 'weapon_tacticalrifle', 'weapon_gusenberg']
    const RandomBoolean = [true, false];
    const RandomPedName = PedsList[Math.floor(Math.random() * PedsList.length)];
    const RandomPedHash = GetHashKey(RandomPedName);
    const RandomPed = CreatePed(4, RandomPedHash, EntityCoords[0], EntityCoords[1] + 10.0, EntityCoords[2], EntityHeading, true, true);
    const HasWeaponChance = RandomBoolean[Math.floor(Math.random() * RandomBoolean.length)];
    if (HasWeaponChance) {
        const RandomWeapon = WeaponsList[Math.floor(Math.random() * WeaponsList.length)];
        const WeaponHash = GetHashKey(RandomWeapon);
        GiveWeaponToPed(RandomPed, WeaponHash, 255, false, true);
        SetPedAmmo(RandomPed, WeaponHash, 255);
        SetPedArmour(RandomPed, 255);
        SetCurrentPedWeapon(RandomPed, WeaponHash, true);
    }
    TaskCombatPed(RandomPed, PlayerPed, 0, 16);
    cb({ success: true, rsp: 'Ped spawned and attacking' });
});

MRCore.Functions.CreateCallback('mrp-admin:server:SpawnItems', async function (source, cb, Items = [], Amount = 1) {
    if (!Items || typeof Items !== 'object' || Items.length < 1) return cb({ success: false, rsp: 'You must select at least 1 item to spawn' });
    const AmountValue = parseInt(Amount);
    if (isNaN(AmountValue) || AmountValue < 1) return cb({ success: false, rsp: 'Amount must be a number and greater than 0' });
    const src = source;
    const HasPermission = MRCore.Functions.HasPermission(src, "admin") || MRCore.Functions.HasPermission(src, "root");
    if (!HasPermission) return cb({ success: false, rsp: 'You dont have permission' });
    const FailedItems = [];
    for (const Item of Items) {
        exports['inventory_v2'].AddItem(Item.spawn_name, AmountValue, src, (success, message) => {
            if (!success) FailedItems.push({ itemName: Item.name, reason: message });
        });
    }
    return cb({ success: true, rsp: `${Items.length - FailedItems.length} items spawned, ${FailedItems.length} Failed [${FailedItems.map(x => `${x.itemName} (${x.reason})`).join(', ')}]` });
});

const UpdateBlipsTick = setTick(async () => {
    await sleep(100)
    try {
        const ActivePlayers = exports['PHOENIX-RP'].GetAllPlayers();
        const Players = ActivePlayers.map(playerID => {
            const PlayerPed = GetPlayerPed(playerID);
            const PlayerCoords = GetEntityCoords(PlayerPed);
            const PlayerName = GetPlayerName(playerID);
            return {
                id: playerID,
                name: PlayerName,
                coords: PlayerCoords,
            }
        });
        emitNet('MRCore:Client:UpdatePlayersBlips', -1, Players);
    } catch (err) {
        console.log('^1[MRP-ADMIN] - Update Blips Interval Crashed', err);
        clearTick(UpdateBlipsTick)
    }
});

RegisterCommand('add_permission', (src, args) => {
    const PlayerID = parseInt(args[0]);
    const Permission = args[1];
    if (isNaN(PlayerID) || !Permission) return MRCore.Functions.ConsoleLog('[ADD PERMISSION] => ID or Permission not found', true);
    const Player = MRCore.Functions.GetPlayer(PlayerID);
    if (!Player) return MRCore.Functions.ConsoleLog('[ADD PERMISSION] => Player not found', true);
    const [retrev, response] = MRCore.Functions.AddPermission(Player.PlayerData.source, Permission);
    MRCore.Functions.ConsoleLog(`[ADD PERMISSION] => ${response}`, !retrev);
}, true);