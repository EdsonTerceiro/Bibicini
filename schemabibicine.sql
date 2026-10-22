
USE cinema;

CREATE TABLE genero (
    id_genero INT AUTO_INCREMENT PRIMARY KEY,
    nome      VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE sala (
    id_sala    INT AUTO_INCREMENT PRIMARY KEY,
    numero     INT NOT NULL UNIQUE,
    capacidade INT NOT NULL CHECK (capacidade > 0)
);

CREATE TABLE usuario (
    id_usuario   INT AUTO_INCREMENT PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    tipo_usuario VARCHAR(30)  NOT NULL DEFAULT 'cliente'
);

CREATE TABLE cupom (
    id_cupom INT AUTO_INCREMENT PRIMARY KEY,
    codigo   VARCHAR(30) NOT NULL UNIQUE,
    desconto DECIMAL(5,2) NOT NULL CHECK (desconto > 0)
);


CREATE TABLE filme (
    id_filme      INT AUTO_INCREMENT PRIMARY KEY,
    titulo        VARCHAR(150) NOT NULL,
    duracao_min   INT NOT NULL CHECK (duracao_min > 0),
    classificacao VARCHAR(20) NOT NULL,
    id_genero     INT NOT NULL,
    CONSTRAINT fk_filme_genero
        FOREIGN KEY (id_genero) REFERENCES genero(id_genero)
);

CREATE TABLE assento (
    id_assento INT AUTO_INCREMENT PRIMARY KEY,
    fileira    CHAR(2) NOT NULL,
    numero     INT NOT NULL,
    id_sala    INT NOT NULL,
    CONSTRAINT fk_assento_sala
        FOREIGN KEY (id_sala) REFERENCES sala(id_sala),
    CONSTRAINT uq_assento_sala UNIQUE (id_sala, fileira, numero)
);

CREATE TABLE sessao (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    data_hora DATETIME NOT NULL,
    preco     DECIMAL(8,2) NOT NULL CHECK (preco >= 0),
    id_filme  INT NOT NULL,
    id_sala   INT NOT NULL,
    CONSTRAINT fk_sessao_filme
        FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
    CONSTRAINT fk_sessao_sala
        FOREIGN KEY (id_sala) REFERENCES sala(id_sala),
    CONSTRAINT uq_sessao_sala_horario UNIQUE (id_sala, data_hora)
);

CREATE TABLE avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    nota         TINYINT NOT NULL CHECK (nota BETWEEN 0 AND 10),
    comentario   TEXT,
    id_filme     INT NOT NULL,
    id_usuario   INT NOT NULL,
    CONSTRAINT fk_avaliacao_filme
        FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
    CONSTRAINT fk_avaliacao_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE ingresso (
    id_ingresso INT AUTO_INCREMENT PRIMARY KEY,
    status      VARCHAR(20) NOT NULL DEFAULT 'reservado',
    valor_pago  DECIMAL(8,2) NOT NULL CHECK (valor_pago >= 0),
    id_usuario  INT NOT NULL,
    id_sessao   INT NOT NULL,
    id_assento  INT NOT NULL,
    id_cupom    INT NULL,
    CONSTRAINT fk_ingresso_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    CONSTRAINT fk_ingresso_sessao
        FOREIGN KEY (id_sessao) REFERENCES sessao(id_sessao),
    CONSTRAINT fk_ingresso_assento
        FOREIGN KEY (id_assento) REFERENCES assento(id_assento),
    CONSTRAINT fk_ingresso_cupom
        FOREIGN KEY (id_cupom) REFERENCES cupom(id_cupom),
    CONSTRAINT uq_ingresso_sessao_assento UNIQUE (id_sessao, id_assento)
);