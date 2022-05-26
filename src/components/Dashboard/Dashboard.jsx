import React from 'react';
import { useEffect } from 'react';
import {
    Page,
    Card,
    Heading,
    TextContainer,
    DisplayText,
    TextStyle
} from '@shopify/polaris';
import { useClientRouting, useRoutePropagation } from "@shopify/app-bridge-react";
import { useLocation, useNavigate } from "react-router-dom";

export const Dashboard = ({
    totalProductCount,
    publishedProductCount,
    createdAfter16MayProductCount,
    getAllCountProduct,
    getPublishedCountProduct,
    getCreadtedAfter16MayCountProduct
}) => {
    const location = useLocation();
    const navigate = useNavigate();
    useRoutePropagation(location);
    useClientRouting({
        replace(path) {
            navigate(path);
        }
    });

    useEffect(() => {
        getAllCountProduct(),
        getPublishedCountProduct(),
        getCreadtedAfter16MayCountProduct()
    }, []);

    return (
        <Page>
            <Card title='All count products' sectioned>
                <TextContainer spacing='loose'>
                    <Heading element="h4">
                        NUMBER OF EXISTING PRODUCTS
                        <DisplayText size="medium">
                            <TextStyle variation="strong">{totalProductCount}</TextStyle>
                        </DisplayText>
                    </Heading>
                </TextContainer>
            </Card>
            <Card title='Published products' sectioned>
                <TextContainer spacing='loose'>
                    <Heading element="h4">
                        NUMBER OF PUBLISHED PRODUCTS
                        <DisplayText size="medium">
                            <TextStyle variation="strong">{publishedProductCount}</TextStyle>
                        </DisplayText>
                    </Heading>
                </TextContainer>
            </Card>
            <Card title='Product created after 16 may' sectioned>
                <TextContainer spacing='loose'>
                    <Heading element="h4">
                        NUMBER OF PRODUCTS WHICH CREATED AFTER 16 MAY
                        <DisplayText size="medium">
                            <TextStyle variation="strong">{createdAfter16MayProductCount}</TextStyle>
                        </DisplayText>
                    </Heading>
                </TextContainer>
            </Card>
        </Page>
    )
}