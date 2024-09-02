package main

import (
	"github.com/BurntSushi/toml"
	"maunium.net/go/mautrix/appservice"
)

type MatrixConfig struct {
	// path to the registration file
	RegistrationPath string `toml:"registration_path"`
	// homeserver's server_name
	HomeserverDomain string `toml:"homeserver_domain"`
	// homeserver's url
	HomeserverURL string `toml:"homeserver_url"`
	// hostname to listen to
	HostHostname string `toml:"plugin_hostname"`
	// port to listen to
	HostPort uint16 `toml:"plugin_port"`
	// plugin url to send events to
	PluginURL string `toml:"plugin_url"`
}

func LoadTomlConfig() MatrixConfig {
	var config MatrixConfig

	_, err := toml.DecodeFile("config.toml", &config)

	if err != nil {
		panic(err)
	}

	return config
}

func GetMatrixConfig(cfg MatrixConfig) appservice.CreateOpts {
	registration, err := appservice.LoadRegistration(cfg.RegistrationPath)

	if err != nil {
		panic(err)
	}

	return appservice.CreateOpts{
		HomeserverURL:    cfg.HomeserverURL,
		HomeserverDomain: cfg.HomeserverDomain,
		Registration:     registration,
		HostConfig: appservice.HostConfig{
			Hostname: cfg.HostHostname,
			Port:     cfg.HostPort,
		},
	}
}
