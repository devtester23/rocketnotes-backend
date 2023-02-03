const { hash, compare } = require('bcryptjs')

const AppError = require('../utils/AppError')

const sqliteConnection = require('../database/sqlite')

class UsersController {
    /** 5 FUNÇÕES/MÉTODOS QUE UMA CLASSE PODE TER:
     *  index   -  GET para listar vários registros.
     *  show    -  GET para exibir um registro especifico.
     *  create  -  POST para criat um registro.
     *  update  -  PUT para atualizar um registro.
     *  delete  -  DELETE para poder remover um registro.
     * 
     *  NÃO É OBRIGATÓRIO TER TODOS OS 5 MÉTODOS
     *  MAS NÃO PODE TER MAIS QUE 5
     */


    async create(req, res) {
        const { name, email, password } = req.body

        const database = await sqliteConnection();
        const checkUserExists = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if (checkUserExists) {
            throw new AppError('Este email já está em uso.')
        }

        const hashedPassword = await hash(password, 8)

        await database.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword])

        return res.status(201).json("Usuário cadastrado com sucesso.");

    }

    async update(req, res) {
        const { name, email, password, old_password } = req.body;
        const user_id = req.user.id

        const database = await sqliteConnection();
        const user = await database.get("SELECT * FROM users WHERE id = (?)", [user_id]);

        if (!user) {
            throw new AppError('Usuário inexistente.')
        }

        const userWithUpdatedEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email])

        if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError('Este email já está em uso.')
        }

        if (name) { user.name = name };
        user.email = email ?? user.email;


        if (password && !old_password) {
            throw new AppError("Você precisa informar sua antiga senha para redefinir a nova.");
        }

        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password)

            if (!checkOldPassword) {
                throw new AppError("A senha antiga não confere.")
            }

            user.password = await hash(password, 8)
        }

        await database.run(`
            UPDATE users SET
                name = ?,
                email = ?,
                password = ?,
                updated_at = DATETIME('now')
            WHERE id = ?`,
            [user.name, user.email, user.password, user_id]
        )

        return res.status(200).json("Atualizado com sucesso.")
    }
}

module.exports = UsersController