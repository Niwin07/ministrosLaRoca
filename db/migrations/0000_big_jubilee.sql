CREATE TABLE `canciones` (
	`id_cancion` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`artista` varchar(255) NOT NULL,
	`bpm` int,
	`metrica` varchar(10),
	`estado_aprobacion` enum('APROBADA','PENDIENTE','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
	`motivo_rechazo` text,
	`letra` text,
	`charts` text,
	CONSTRAINT `canciones_id_cancion` PRIMARY KEY(`id_cancion`)
);
--> statement-breakpoint
CREATE TABLE `cronograma` (
	`id_turno` int AUTO_INCREMENT NOT NULL,
	`id_usuario` int NOT NULL,
	`fecha_servicio` date NOT NULL,
	`estado_turno` enum('PENDIENTE','COMPLETADO','AUSENTE') NOT NULL DEFAULT 'PENDIENTE',
	CONSTRAINT `cronograma_id_turno` PRIMARY KEY(`id_turno`)
);
--> statement-breakpoint
CREATE TABLE `lista_canciones` (
	`id_lista_cancion` int AUTO_INCREMENT NOT NULL,
	`id_playlist` int NOT NULL,
	`id_cancion` int NOT NULL,
	`orden` int NOT NULL,
	`nota` varchar(10),
	CONSTRAINT `lista_canciones_id_lista_cancion` PRIMARY KEY(`id_lista_cancion`),
	CONSTRAINT `uq_playlist_orden` UNIQUE(`id_playlist`,`orden`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id_playlist` int AUTO_INCREMENT NOT NULL,
	`id_usuario` int NOT NULL,
	`nombre` varchar(255) NOT NULL,
	`tipo` enum('PRESET','EVENTO') NOT NULL,
	`estado` enum('PREPARACION','ENSAYO','DEFINITIVA','MAZO'),
	`fecha_programada` datetime,
	CONSTRAINT `playlists_id_playlist` PRIMARY KEY(`id_playlist`)
);
--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id_usuario` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`rol` enum('ADMINISTRADOR','LIDER','MINISTRO') NOT NULL,
	CONSTRAINT `usuarios_id_usuario` PRIMARY KEY(`id_usuario`),
	CONSTRAINT `usuarios_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `cronograma` ADD CONSTRAINT `cronograma_id_usuario_usuarios_id_usuario_fk` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lista_canciones` ADD CONSTRAINT `lista_canciones_id_playlist_playlists_id_playlist_fk` FOREIGN KEY (`id_playlist`) REFERENCES `playlists`(`id_playlist`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lista_canciones` ADD CONSTRAINT `lista_canciones_id_cancion_canciones_id_cancion_fk` FOREIGN KEY (`id_cancion`) REFERENCES `canciones`(`id_cancion`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlists` ADD CONSTRAINT `playlists_id_usuario_usuarios_id_usuario_fk` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_playlist` ON `lista_canciones` (`id_playlist`);