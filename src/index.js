const express = require('express');
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json())

const customers = [];

function verifyIfExistsAccountDocument(request, response, next) {
    const { document } = request.headers;

    const customer = customers.find((customer) => customer.document === document);

    if (!customer) {
        return response.status(400).json({
            error: "Customer not found."
        });
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    return statement.reduce((acc, operation) => {
        return operation.type == 'credit'
            ? acc += operation.amount
            : acc -= operation.amount;
    }, 0);
}

app.post("/account", (request, response) => {
    const { document, name } = request.body;

    const customerAlreadyExists = customers.some((customer) => customer.document === document);

    if (customerAlreadyExists) {
        return response.status(400).json({
            error: "Customer alerady exists."
        });
    }

    customers.push({
        document,
        name,
        id: uuid(),
        statement: []
    });

    return response.status(201).send();
});

app.post("/deposit", verifyIfExistsAccountDocument, (request, response) => {
    const { description, amount } = request.body;
    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountDocument, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({
            error: "Insuficient funds."
        });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/statement", verifyIfExistsAccountDocument, (request, response) => {
    const { customer } = request;

    return response.json(customer.statement);
});

app.get("/statement/date", verifyIfExistsAccountDocument, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => {
        return statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    });

    return response.json(statement);
});

app.put("/account", verifyIfExistsAccountDocument, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    const index = customers.findIndex((item) => item.document === customer.document);

    customers[index].name = name;
    customer.name = name;

    return response.status(200).send();
});

app.delete("/account", verifyIfExistsAccountDocument, (request, response) => {
    const { customer } = request;

    customers.splice(customer, 1);

    return response.status(200).json(customers);
});

app.listen(3333);