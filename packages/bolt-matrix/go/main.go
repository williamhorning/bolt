package main

import (
	"maunium.net/go/mautrix/appservice"
)

func main() {
	cfg := LoadTomlConfig()
	matrix_cfg := GetMatrixConfig(cfg)

	appsvc, err := appservice.CreateFull(matrix_cfg)

	if err != nil {
		panic(err)
	}

	LightningListener(appsvc)

	MatrixListener(appsvc, cfg)

	appsvc.Start()
}
