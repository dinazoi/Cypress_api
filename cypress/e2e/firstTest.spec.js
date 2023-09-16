/// <reference types="cypress" />

describe('Test with backend', () => {

    beforeEach('login to the app', () => {
        cy.intercept({method:'Get', path:'tags'}, {fixture: 'tags.json'})
        cy.loginToApplication()
    })

    it('verify correct request and response', () => {
        
        cy.intercept('POST', Cypress.env('apiUrl')+'/api/articles/').as('postArticles')

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is the title1')
        cy.get('[formcontrolname="description"]').type('This is a description')
        cy.get('[formcontrolname="body"]').type('This is a body of the article')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles').then( xhr => {
            expect(xhr.response.statusCode).to.equal(201)
            expect(xhr.request.body.article.body).to.equal('This is a body of the article')
            expect(xhr.response.body.article.description).to.equal('This is a description')
        })
    })

    it('intercepting and modifying the request and response', () => {
        
        cy.intercept('POST', '**/articles', (req) => {
            req.body.article.description = "This is a description 2"
        }).as('postArticles')

        cy.contains('New Article').click()
        cy.get('[formcontrolname="title"]').type('This is the title2')
        cy.get('[formcontrolname="description"]').type('This is a description')
        cy.get('[formcontrolname="body"]').type('This is a body of the article')
        cy.contains('Publish Article').click()

        cy.wait('@postArticles').then( xhr => {
            expect(xhr.response.statusCode).to.equal(201)
            expect(xhr.request.body.article.body).to.equal('This is a body of the article')
            expect(xhr.response.body.article.description).to.equal('This is a description 2')
        })
    })

    it('verify popular tags are displayed', () => {
        cy.get('[class="tag-list"]')
        .should('contain', 'Testing')
        .and('contain', 'Win')
        .and('contain', 'For')
        .and('contain', 'All')
    })

    it('verify global feed likes count', () => {
        cy.intercept('GET', Cypress.env('apiUrl')+'/api/articles*', { fixture: 'articles.json'})

        cy.get('app-article-list button').then(heartList => {
            expect(heartList[0]).to.contain('1')
            expect(heartList[1]).to.contain('5')
        })

        cy.fixture('articles').then(file => {
            const articleLink = file.articles[1].slug
            file.articles[1].favoritesCount = 6
            cy.intercept('POST', Cypress.env('apiUrl')+'/api/articles/'+articleLink+'/favorite', file)
        })

        cy.get('app-article-list button').eq(1).click().should('contain', '6')

    })

    it('delete a new article in a global feed', () => {

        //old way
        // const userCredentials = {
        //     "user":{
        //         "email": "olehshytikov1990@gmail.com",
        //         "password": "Passpro1"
        //     }
        // }


        const bodyRequest = {
            "article":{
                "tagList": [],
                "title": "Request from API",
                "description": "API testing is easy",
                "body": "Angular is cool"
            }
        }


        //classic 
        //cy.request('POST', 'https://conduit.productionready.io/api/users/login', userCredentials)
        //.its('body')

        //new
            cy.get('@token').then(token => {
            //const token = body.user.token

            cy.request({
                url: 'https://conduit.productionready.io/api/articles/',
                headers: {'Authorization': 'Token '+token},
                method: 'POST',
                body: bodyRequest
            }).then( response => {
                expect(response.status).to.equal(201)
            })

            cy.contains('Global Feed').click()
            cy.intercept('**/articles*').as('Articles')
            cy.wait('@Articles')
            cy.get('.article-preview').first().click()
            cy.get('.article-page').should('contain', 'Request from API')
            cy.get('.article-actions').contains('Delete Article').click()

            cy.request({
                url: Cypress.env('apiUrl')+'/api/articles*',
                headers: {'Authorization': 'Token '+token},
                method: 'GET'
            }).its('body').then( body => {
                expect(body.articles[0].title).not.to.equal('Request from API')
            })
            

        })

    })

})