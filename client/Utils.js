function DrawEntityBoundingBox(entity, color) {
  let model = GetEntityModel(entity);
  let dimensions = GetModelDimensions(model);
  let min = dimensions[0];
  let max = dimensions[1];
  let matrix = GetEntityMatrix(entity);
  let rightVector = matrix[0];
  let forwardVector = matrix[1];
  let upVector = matrix[2];
  let position = matrix[3];

  // Calculate size
  let dim = {
    x: 0.5 * (max[0] - min[0]),
    y: 0.5 * (max[1] - min[1]),
    z: 0.5 * (max[2] - min[2])
  };

  let FUR = {
    x: position[0] + dim.y * rightVector[0] + dim.x * forwardVector[0] + dim.z * upVector[0],
    y: position[1] + dim.y * rightVector[1] + dim.x * forwardVector[1] + dim.z * upVector[1],
    z: 0
  };

  let FURGround = GetGroundZFor_3dCoord(FUR.x, FUR.y, 1000.0, 0);
  FUR.z = FURGround[1];
  FUR.z = FUR.z + 2 * dim.z;

  let BLL = {
    x: position[0] - dim.y * rightVector[0] - dim.x * forwardVector[0] - dim.z * upVector[0],
    y: position[1] - dim.y * rightVector[1] - dim.x * forwardVector[1] - dim.z * upVector[1],
    z: 0
  };

  let BLLGround = GetGroundZFor_3dCoord(FUR.x, FUR.y, 1000.0, 0);
  BLL.z = BLLGround[1];

  // DEBUG
  let edge1 = BLL;
  let edge5 = FUR;

  //console.log('Dim', dim, 'Edge1', edge1, 'Edge5', edge5);

  let edge2 = {
    x: edge1.x + 2 * dim.y * rightVector[0],
    y: edge1.y + 2 * dim.y * rightVector[1],
    z: edge1.z + 2 * dim.y * rightVector[2]
  };

  let edge3 = {
    x: edge2.x + 2 * dim.z * upVector[0],
    y: edge2.y + 2 * dim.z * upVector[1],
    z: edge2.z + 2 * dim.z * upVector[2]
  };

  let edge4 = {
    x: edge1.x + 2 * dim.z * upVector[0],
    y: edge1.y + 2 * dim.z * upVector[1],
    z: edge1.z + 2 * dim.z * upVector[2]
  };

  let edge6 = {
    x: edge5.x - 2 * dim.y * rightVector[0],
    y: edge5.y - 2 * dim.y * rightVector[1],
    z: edge5.z - 2 * dim.y * rightVector[2]
  };

  let edge7 = {
    x: edge6.x - 2 * dim.z * upVector[0],
    y: edge6.y - 2 * dim.z * upVector[1],
    z: edge6.z - 2 * dim.z * upVector[2]
  };

  let edge8 = {
    x: edge5.x - 2 * dim.z * upVector[0],
    y: edge5.y - 2 * dim.z * upVector[1],
    z: edge5.z - 2 * dim.z * upVector[2]
  };

  DrawLine(edge1.x, edge1.y, edge1.z, edge2.x, edge2.y, edge2.z, color.r, color.g, color.b, color.a);
  DrawLine(edge1.x, edge1.y, edge1.z, edge4.x, edge4.y, edge4.z, color.r, color.g, color.b, color.a);
  DrawLine(edge2.x, edge2.y, edge2.z, edge3.x, edge3.y, edge3.z, color.r, color.g, color.b, color.a);
  DrawLine(edge3.x, edge3.y, edge3.z, edge4.x, edge4.y, edge4.z, color.r, color.g, color.b, color.a);
  DrawLine(edge5.x, edge5.y, edge5.z, edge6.x, edge6.y, edge6.z, color.r, color.g, color.b, color.a);
  DrawLine(edge5.x, edge5.y, edge5.z, edge8.x, edge8.y, edge8.z, color.r, color.g, color.b, color.a);
  DrawLine(edge6.x, edge6.y, edge6.z, edge7.x, edge7.y, edge7.z, color.r, color.g, color.b, color.a);
  DrawLine(edge7.x, edge7.y, edge7.z, edge8.x, edge8.y, edge8.z, color.r, color.g, color.b, color.a);
  DrawLine(edge1.x, edge1.y, edge1.z, edge7.x, edge7.y, edge7.z, color.r, color.g, color.b, color.a);
  DrawLine(edge2.x, edge2.y, edge2.z, edge8.x, edge8.y, edge8.z, color.r, color.g, color.b, color.a);
  DrawLine(edge3.x, edge3.y, edge3.z, edge5.x, edge5.y, edge5.z, color.r, color.g, color.b, color.a);
  DrawLine(edge4.x, edge4.y, edge4.z, edge6.x, edge6.y, edge6.z, color.r, color.g, color.b, color.a);
}

function DrawEntityBoundingBox(entity, r, g, b, a) {
  const model = GetEntityModel(entity);

  const [minimum, maximum] = GetModelDimensions(model);

  const pad = 0.001;

  const vertices = [
    GetOffsetFromEntityInWorldCoords(entity, minimum[0] - pad, minimum[1] - pad, minimum[2] - pad),
    GetOffsetFromEntityInWorldCoords(entity, maximum[0] + pad, minimum[1] - pad, minimum[2] - pad),
    GetOffsetFromEntityInWorldCoords(entity, maximum[0] + pad, maximum[1] + pad, minimum[2] - pad),
    GetOffsetFromEntityInWorldCoords(entity, minimum[0] - pad, maximum[1] + pad, minimum[2] - pad),
    GetOffsetFromEntityInWorldCoords(entity, minimum[0] - pad, minimum[1] - pad, maximum[2] + pad),
    GetOffsetFromEntityInWorldCoords(entity, maximum[0] + pad, minimum[1] - pad, maximum[2] + pad),
    GetOffsetFromEntityInWorldCoords(entity, maximum[0] + pad, maximum[1] + pad, maximum[2] + pad),
    GetOffsetFromEntityInWorldCoords(entity, minimum[0] - pad, maximum[1] + pad, maximum[2] + pad)
  ];

  const polyMatrix = [
    [vertices[2], vertices[1], vertices[0]],
    [vertices[3], vertices[2], vertices[0]],
    [vertices[4], vertices[5], vertices[6]],
    [vertices[4], vertices[6], vertices[7]],
    [vertices[2], vertices[3], vertices[6]],
    [vertices[7], vertices[6], vertices[3]],
    [vertices[0], vertices[1], vertices[4]],
    [vertices[5], vertices[4], vertices[1]],
    [vertices[1], vertices[2], vertices[5]],
    [vertices[2], vertices[6], vertices[5]],
    [vertices[4], vertices[7], vertices[3]],
    [vertices[4], vertices[3], vertices[0]]
  ];

  for (let i = 0; i < polyMatrix.length; i++) {
    const poly = polyMatrix[i];
    const [x1, y1, z1] = poly[0];
    const [x2, y2, z2] = poly[1];
    const [x3, y3, z3] = poly[2];
    DrawPoly(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, b, a);
  }
}

function InstructionalButton(controlButton, text) {
  ScaleformMovieMethodAddParamPlayerNameString(controlButton)
  BeginTextCommandScaleformString("STRING")
  AddTextComponentScaleform(text)
  EndTextCommandScaleformString()
}

function RotationToDirection(rotation) {
  let adjustedRotation = {
    x: (Math.PI / 180) * rotation[0],
    y: (Math.PI / 180) * rotation[1],
    z: (Math.PI / 180) * rotation[2]
  };

  let direction = {
    x: -Math.sin(adjustedRotation.z) * Math.abs(Math.cos(adjustedRotation.x)),
    y: Math.cos(adjustedRotation.z) * Math.abs(Math.cos(adjustedRotation.x)),
    z: Math.sin(adjustedRotation.x)
  };

  return direction;
}

function RayCastGamePlayCamera(distance = 100.0) {
  const cameraRotation = GetGameplayCamRot()
  const cameraCoord = GetGameplayCamCoord()
  const direction = RotationToDirection(cameraRotation)
  const destination = {
    x: cameraCoord[0] + direction.x * distance,
    y: cameraCoord[1] + direction.y * distance,
    z: cameraCoord[2] + direction.z * distance
  }
  const [a, b, c, d, e] = GetShapeTestResult(StartShapeTestRay(cameraCoord[0], cameraCoord[1], cameraCoord[2], destination.x, destination.y, destination.z, -1, PlayerPedId(), 0))
  return [b, c, e]
}

function DrawText3D(x, y, z, text) {
  const [onScreen, screenX, screenY] = GetScreenCoordFromWorldCoord(x, y, z);
  if (onScreen) {
    SetTextScale(0.35, 0.35);
    SetTextFont(4);
    SetTextColour(255, 255, 255, 255);
    SetTextDropshadow(0, 0, 0, 0, 255);
    SetTextEdge(2, 0, 0, 0, 150);
    SetTextEntry("STRING");
    SetTextCentre(true);
    AddTextComponentString(text);
    DrawText(screenX, screenY);
  }
}

function NativeText(text) {
  SetTextColour(186, 186, 186, 255)
  SetTextFont(0)
  SetTextScale(0.378, 0.378)
  SetTextWrap(0.0, 1.0)
  SetTextRightJustify(true)
  SetTextDropshadow(0, 0, 0, 0, 255)
  SetTextEdge(1, 0, 0, 0, 205)
  SetTextEntry("STRING")
  AddTextComponentString(text)
  DrawText(0.017, 0.977)
}

const VehicleHandlingTypes = [
  {
    id: 'fDownforceModifier',
    label: 'Down Force (fDownforceModifier)',
    min: 1,
    max: 5,
    step: 0.5,
  },
  {
    id: 'fInitialDragCoeff',
    label: 'Air Resistance (fInitialDragCoeff)',
    min: 1,
    max: 20,
    step: 0.5,
  },
  {
    id: 'fMass',
    label: 'Mass (fMass)',
    min: 0,
    max: 15000,
    step: 1,
  },
  {
    id: 'fInitialDriveForce',
    label: 'Power / Acceleration (fInitialDriveForce)',
    min: 0,
    max: 0.5,
    step: 0.005,
  },
  {
    id: 'fDriveInertia',
    label: 'Drive Inertia (fDriveInertia)',
    min: 0,
    max: 3,
    step: 0.001,
  },
  {
    id: 'fInitialDriveMaxFlatVel',
    label: 'Top Speed (fInitialDriveMaxFlatVel)',
    min: 0,
    max: 200,
    step: 1,
  },
  {
    id: 'fClutchChangeRateScaleUpShift',
    label: 'Shift times (fClutchChangeRateScaleUpShift)',
    min: 0,
    max: 10,
    step: 0.25,
  },
  {
    id: 'fDriveBiasFront',
    label: 'Power Bias (fDriveBiasFront)',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    id: 'fBrakeForce',
    label: 'Brake Force (fBrakeForce)',
    min: 0.1,
    max: 1,
    step: 0.001,
  },
  {
    id: 'fBrakeBiasFront',
    label: 'Brake Bias (fBrakeBiasFront)',
    min: 0,
    max: 1,
    step: 0.025,
  },
  {
    id: 'fHandBrakeForce',
    label: 'Handbrake Force (fHandBrakeForce)',
    min: 0,
    max: 1,
    step: 0.05,
  },
  {
    id: 'fTractionCurveMax',
    label: 'Tire Grip (fTractionCurveMax)',
    min: 0,
    max: 3,
    step: 0.05,
  },
  {
    id: 'fTractionCurveLateral',
    label: 'Traction Curve (fTractionCurveLateral)',
    min: 10,
    max: 30,
    step: 0.5,
  },
  {
    id: 'fTractionBiasFront',
    label: 'Tire Grip Bias (fTractionBiasFront)',
    min: 0,
    max: 1,
    step: 0.005,
  },
  {
    id: 'fSuspensionForce',
    label: 'Spring Strength (fSuspensionForce)',
    min: 0,
    max: 5,
    step: 0.001
  },
  {
    id: 'fSuspensionCompDamp',
    label: 'Spring Dampen Strength (fSuspensionCompDamp)',
    min: 0,
    max: 3,
    step: 0.05
  },
  {
    id: 'fSuspensionUpperLimit',
    label: 'Compression/Decompression Limits (fSuspensionUpperLimit)',
    min: 0,
    max: 1,
    step: 0.005
  },
  {
    id: 'fSuspensionRaise',
    label: 'Suspension Raise (fSuspensionRaise)',
    min: -1,
    max: 1,
    step: 0.05,
  },
  {
    id: 'fSuspensionBiasFront',
    label: 'Strength Bias (fSuspensionBiasFront)',
    min: 0,
    max: 1,
    step: 0.005,
  },
  {
    id: 'fAntiRollBarForce',
    label: 'Antiroll Strength (fAntiRollBarForce)',
    min: 0,
    max: 2,
    step: 0.001,
  },
  {
    id: 'fAntiRollBarBiasFront',
    label: 'Strength Bias (fAntiRollBarBiasFront)',
    min: 0,
    max: 1,
    step: 0.05
  },
  {
    id: 'fRollCentreHeightFront',
    label: 'Rollcentre - Front (fRollCentreHeightFront)',
    min: 0,
    max: 1,
    step: 0.001,
  },
  {
    id: 'fRollCentreHeightRear',
    label: 'Rollcentre - Back (fRollCentreHeightRear)',
    min: 0,
    max: 1,
    step: 0.05
  }
];